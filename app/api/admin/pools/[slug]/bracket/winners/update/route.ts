import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { bracketGames, bracketTeams, pools } from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";
import {
  resolveTeamForBracketSlot,
  type ResolvedGame,
  type ResolvedTeam,
} from "@/lib/brackets/resolve";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/");

  const { slug } = await context.params;
  const formData = await request.formData();

  const poolRows = await db
    .select()
    .from(pools)
    .where(eq(pools.slug, slug))
    .limit(1);

  const pool = poolRows[0];
  if (!pool) redirect("/admin");

  if (pool.poolType !== "bracket") {
    redirect(`/admin/pools/${pool.slug}`);
  }

  const games = await db
    .select()
    .from(bracketGames)
    .where(eq(bracketGames.poolId, pool.id));

  const teams = await db
    .select()
    .from(bracketTeams)
    .where(eq(bracketTeams.poolId, pool.id));

  const teamById = new Map(teams.map((team) => [team.id, team]));

  const existingWinnerTeamByGameId = new Map(
    games
      .filter((game) => game.winnerTeamId)
      .map((game) => [game.id, game.winnerTeamId as string])
  );

  const submittedWinnerTeamByGameId = new Map<string, string>();

  for (const game of games) {
    const winnerTeamId = String(formData.get(`winner-${game.id}`) ?? "").trim();

    if (winnerTeamId) {
      submittedWinnerTeamByGameId.set(game.id, winnerTeamId);
    }
  }

  const winnerTeamByGameId = new Map([
    ...existingWinnerTeamByGameId,
    ...submittedWinnerTeamByGameId,
  ]);

  for (const game of games) {
    const winnerTeamId = String(formData.get(`winner-${game.id}`) ?? "").trim();

    if (!winnerTeamId) {
      await db
        .update(bracketGames)
        .set({
          winnerTeamId: null,
          status: "scheduled",
          updatedAt: new Date(),
        })
        .where(eq(bracketGames.id, game.id));

      winnerTeamByGameId.delete(game.id);
      continue;
    }

    const teamA = resolveTeamForBracketSlot({
      game: game as ResolvedGame,
      slot: "A",
      games: games as ResolvedGame[],
      teamById: teamById as Map<string, ResolvedTeam>,
      pickedTeamByGameId: winnerTeamByGameId,
    });

    const teamB = resolveTeamForBracketSlot({
      game: game as ResolvedGame,
      slot: "B",
      games: games as ResolvedGame[],
      teamById: teamById as Map<string, ResolvedTeam>,
      pickedTeamByGameId: winnerTeamByGameId,
    });

    const validResolvedTeamIds = new Set(
      [teamA?.id, teamB?.id].filter((value): value is string => Boolean(value))
    );

    if (!validResolvedTeamIds.has(winnerTeamId)) continue;

    await db
      .update(bracketGames)
      .set({
        winnerTeamId,
        status: "final",
        updatedAt: new Date(),
      })
      .where(eq(bracketGames.id, game.id));

    winnerTeamByGameId.set(game.id, winnerTeamId);
  }

  redirect(`/admin/pools/${pool.slug}/bracket/setup?winnersUpdated=1`);
}