import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import {
  calculateGolfEntryScore,
  getGolfBonus,
  type GolfScoringSettings,
} from "@/lib/scoring/golf";

import { db } from "@/db";
import {
  entries,
  entryPicks,
  leaderboardResults,
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

  if (pool.poolType !== "golf") {
    redirect(`/admin/pools/${pool.slug}?unsupportedFinalize=1`);
  }

  const golfScoringSettings =
    pool.scoringSettings && typeof pool.scoringSettings === "object"
      ? (pool.scoringSettings as GolfScoringSettings)
      : {};

  const poolEntries = await db
    .select()
    .from(entries)
    .where(eq(entries.poolId, pool.id));

  const picks = await db
    .select()
    .from(entryPicks)
    .where(eq(entryPicks.poolId, pool.id));

  const results = await db
    .select()
    .from(leaderboardResults)
    .where(eq(leaderboardResults.poolId, pool.id));

  const resultByOptionId = new Map(
    results.map((result) => [result.pickOptionId, result])
  );

  const standings = poolEntries
    .map((entry) => {
      const entryPickRows = picks.filter((pick) => pick.entryId === entry.id);

 const golfScore = calculateGolfEntryScore(
  entryPickRows.map((pick) => {
    const position = resultByOptionId.get(pick.pickOptionId)?.position ?? null;
    const bonus =
      typeof position === "number"
        ? getGolfBonus(position, golfScoringSettings)
        : 0;

    return {
      position,
      bonus,
      score:
        typeof position === "number"
          ? position - bonus
          : null,
    };
  }),
  golfScoringSettings
);

const hasCompleteScore = golfScore.hasCompleteScore;
const basePositionScore = golfScore.baseScore ?? 0;
const totalBonus = golfScore.totalBonus;
const finalGolfScore = golfScore.totalScore ?? 0;

      return {
        entry,
        basePositionScore,
        totalBonus,
        finalGolfScore,
        hasCompleteScore,
      };
    })
    .filter((standing) => standing.hasCompleteScore)
    .sort((a, b) => a.finalGolfScore - b.finalGolfScore);

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
      updatedAt: new Date(),
      completedAt: new Date(),
    })
    .where(eq(pools.id, pool.id));

  redirect(`/pools/${pool.slug}`);
}