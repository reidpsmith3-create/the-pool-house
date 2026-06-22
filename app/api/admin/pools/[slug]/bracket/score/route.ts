import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  bracketGames,
  bracketPicks,
  bracketScoringRules,
  entries,
  pools,
} from "@/db/schema";
import { calculateBracketEntryScore } from "@/lib/scoring/bracket";
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

  if (pool.poolType !== "bracket") {
    redirect(`/admin/pools/${pool.slug}`);
  }

  const poolEntries = await db
    .select()
    .from(entries)
    .where(eq(entries.poolId, pool.id));

  const games = await db
    .select()
    .from(bracketGames)
    .where(eq(bracketGames.poolId, pool.id));

  const picks = await db
    .select()
    .from(bracketPicks)
    .where(eq(bracketPicks.poolId, pool.id));

  const rules = await db
    .select()
    .from(bracketScoringRules)
    .where(eq(bracketScoringRules.poolId, pool.id));

  const scoredEntries = poolEntries
    .map((entry) => {
      const score = calculateBracketEntryScore({
        entryId: entry.id,
        picks,
        games,
        rules,
      });

      return {
        entry,
        totalPoints: score.totalPoints,
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints);

  for (const [index, scoredEntry] of scoredEntries.entries()) {
    await db
      .update(entries)
      .set({
        currentScore: String(scoredEntry.totalPoints),
        currentRank: index + 1,
        updatedAt: new Date(),
      })
      .where(eq(entries.id, scoredEntry.entry.id));
  }

  redirect(`/admin/pools/${pool.slug}/bracket/setup?scoreUpdated=1`);
}