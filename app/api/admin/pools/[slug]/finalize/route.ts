import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  entries,
  entryPicks,
  leaderboardResults,
  pickOptions,
  pools,
} from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/");

  const { slug } = await context.params;

  const poolRows = await db
    .select()
    .from(pools)
    .where(eq(pools.slug, slug))
    .limit(1);

  const pool = poolRows[0];
  if (!pool) redirect("/admin");

  const poolEntries = await db
    .select()
    .from(entries)
    .where(eq(entries.poolId, pool.id));

  const picks = await db
    .select()
    .from(entryPicks)
    .where(eq(entryPicks.poolId, pool.id));

  const options = await db
    .select()
    .from(pickOptions)
    .where(eq(pickOptions.poolId, pool.id));

  const results = await db
    .select()
    .from(leaderboardResults)
    .where(eq(leaderboardResults.poolId, pool.id));

  const optionById = new Map(options.map((option) => [option.id, option]));
  const resultByOptionId = new Map(
    results.map((result) => [result.pickOptionId, result])
  );

  const standings = poolEntries
    .map((entry) => {
      const entryPickRows = picks.filter((pick) => pick.entryId === entry.id);

      const selectedGolfers = entryPickRows.map((pick) => {
        const option = optionById.get(pick.pickOptionId);
        const result = resultByOptionId.get(pick.pickOptionId);

        return {
          name: option?.displayName ?? option?.name ?? "Unknown",
          position: result?.position ?? null,
          score: Number(result?.scoreValue ?? 0),
        };
      });

      const totalScore = selectedGolfers.reduce(
        (sum, golfer) => sum + golfer.score,
        0
      );

      return {
        entry,
        totalScore,
        hasCompleteScore:
          selectedGolfers.length > 0 &&
          selectedGolfers.every((golfer) => golfer.position !== null),
      };
    })
    .filter((standing) => standing.hasCompleteScore)
    .sort((a, b) => a.totalScore - b.totalScore);

  const winner = standings[0];

  if (!winner) {
    redirect(`/pools/${pool.slug}/leaderboard`);
  }

  await db
    .update(pools)
    .set({
      status: "completed",
      winnerEntryId: winner.entry.id,
      winnerName: winner.entry.participantName,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(pools.id, pool.id));

  redirect(`/pools/${pool.slug}`);
}