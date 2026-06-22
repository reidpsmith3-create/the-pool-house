import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { bracketGames, bracketTeams, pools } from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";

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

  const validTeamIds = new Set(teams.map((team) => team.id));

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

      continue;
    }

    if (!validTeamIds.has(winnerTeamId)) continue;

    if (winnerTeamId !== game.teamAId && winnerTeamId !== game.teamBId) {
      continue;
    }

    await db
      .update(bracketGames)
      .set({
        winnerTeamId,
        status: "final",
        updatedAt: new Date(),
      })
      .where(eq(bracketGames.id, game.id));
  }

  const updatedGames = await db
    .select()
    .from(bracketGames)
    .where(eq(bracketGames.poolId, pool.id));

  for (const game of updatedGames) {
    if (!game.winnerTeamId) continue;

    const nextGames = updatedGames.filter(
      (nextGame) =>
        nextGame.sourceGameAId === game.id || nextGame.sourceGameBId === game.id
    );

    for (const nextGame of nextGames) {
      if (nextGame.sourceGameAId === game.id) {
        await db
          .update(bracketGames)
          .set({
            teamAId: game.winnerTeamId,
            updatedAt: new Date(),
          })
          .where(eq(bracketGames.id, nextGame.id));
      }

      if (nextGame.sourceGameBId === game.id) {
        await db
          .update(bracketGames)
          .set({
            teamBId: game.winnerTeamId,
            updatedAt: new Date(),
          })
          .where(eq(bracketGames.id, nextGame.id));
      }
    }
  }

  redirect(`/admin/pools/${pool.slug}/bracket/setup?winnersUpdated=1`);
}