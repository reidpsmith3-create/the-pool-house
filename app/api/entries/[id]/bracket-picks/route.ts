import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  bracketGames,
  bracketPicks,
  bracketTeams,
  entries,
  pools,
} from "@/db/schema";
import { getCurrentUser, getIsAdmin } from "@/lib/auth-helpers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const currentUser = await getCurrentUser();
  const isAdmin = await getIsAdmin();

  if (!currentUser && !isAdmin) redirect("/");

  const entryRows = await db
    .select({ entry: entries, pool: pools })
    .from(entries)
    .innerJoin(pools, eq(entries.poolId, pools.id))
    .where(eq(entries.id, id))
    .limit(1);

  const row = entryRows[0];
  if (!row) redirect("/");

  if (row.pool.poolType !== "bracket") {
    redirect(`/entries/${row.entry.id}`);
  }

  if (!isAdmin && currentUser && row.entry.userId !== currentUser.id) {
    redirect("/");
  }

  const deadlinePassed =
    row.pool.entryDeadlineAt &&
    new Date(row.pool.entryDeadlineAt).getTime() <= Date.now();

  if (deadlinePassed && !isAdmin) {
    redirect(`/entries/${row.entry.id}?locked=1`);
  }

  const formData = await request.formData();

  const games = await db
    .select()
    .from(bracketGames)
    .where(eq(bracketGames.poolId, row.pool.id))
    .orderBy(asc(bracketGames.roundOrder), asc(bracketGames.gameNumber));

  const teams = await db
    .select()
    .from(bracketTeams)
    .where(eq(bracketTeams.poolId, row.pool.id));

  const validTeamIds = new Set(teams.map((team) => team.id));
  const pickedTeamByGameId = new Map<string, string>();

  const picksToInsert: (typeof bracketPicks.$inferInsert)[] = [];

  for (const game of games) {
    const pickedTeamId = String(formData.get(`game-${game.id}`) ?? "").trim();

    if (!pickedTeamId) continue;
    if (!validTeamIds.has(pickedTeamId)) continue;

    const sourcePickA = game.sourceGameAId
      ? pickedTeamByGameId.get(game.sourceGameAId)
      : null;

    const sourcePickB = game.sourceGameBId
      ? pickedTeamByGameId.get(game.sourceGameBId)
      : null;

    const availableTeamAId = game.teamAId ?? sourcePickA ?? null;
    const availableTeamBId = game.teamBId ?? sourcePickB ?? null;

    if (pickedTeamId !== availableTeamAId && pickedTeamId !== availableTeamBId) {
      continue;
    }

    pickedTeamByGameId.set(game.id, pickedTeamId);

    picksToInsert.push({
      poolId: row.pool.id,
      entryId: row.entry.id,
      bracketGameId: game.id,
      pickedTeamId,
      updatedAt: new Date(),
    });
  }

  await db.delete(bracketPicks).where(eq(bracketPicks.entryId, row.entry.id));

  if (picksToInsert.length > 0) {
    await db.insert(bracketPicks).values(picksToInsert);
  }

  redirect(`/entries/${row.entry.id}?saved=1`);
}