import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
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
  pickOptions,
  pools,
} from "@/db/schema";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PoolLeaderboardPage({ params }: PageProps) {
  const { slug } = await params;

  const poolRows = await db
    .select()
    .from(pools)
    .where(eq(pools.slug, slug))
    .limit(1);

  const pool = poolRows[0];

  if (!pool) {
    notFound();
  }

  const isGolfPool = pool.poolType === "golf";

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

  const options = await db
    .select()
    .from(pickOptions)
    .where(eq(pickOptions.poolId, pool.id));

  const results = isGolfPool
    ? await db
        .select()
        .from(leaderboardResults)
        .where(eq(leaderboardResults.poolId, pool.id))
    : [];

  const optionById = new Map(options.map((option) => [option.id, option]));
  const resultByOptionId = new Map(
    results.map((result) => [result.pickOptionId, result])
  );

  const standings = poolEntries
    .map((entry) => {
      const entryPickRows = picks.filter((pick) => pick.entryId === entry.id);

      const selectedPicks = entryPickRows.map((pick) => {
        const option = optionById.get(pick.pickOptionId);
        const result = isGolfPool ? resultByOptionId.get(pick.pickOptionId) : null;
        const position = result?.position ?? null;
        const bonus =
          isGolfPool && typeof position === "number"
            ? getGolfBonus(position, golfScoringSettings)
            : 0;

        return {
          name: option?.displayName ?? option?.name ?? "Unknown",
          position,
          displayPosition: result?.displayPosition ?? null,
          bonus,
        };
      });
      selectedPicks.sort((a, b) => {
  if (a.position === null && b.position === null) return 0;
  if (a.position === null) return 1;
  if (b.position === null) return -1;
  return a.position - b.position;
});

const golfScore = isGolfPool
  ? calculateGolfEntryScore(
      selectedPicks.map((pick) => ({
        position: pick.position,
        bonus: pick.bonus,
        score:
          typeof pick.position === "number"
            ? pick.position - pick.bonus
            : null,
      })),
      golfScoringSettings
    )
  : null;

const baseScore = isGolfPool ? golfScore?.baseScore : entry.currentScore;
const totalBonus = isGolfPool ? golfScore?.totalBonus ?? 0 : 0;
const totalScore = isGolfPool ? golfScore?.totalScore : entry.currentScore;
const hasCompleteScore = isGolfPool
  ? Boolean(golfScore?.hasCompleteScore)
  : entry.currentScore !== null;

      return {
        entry,
        selectedPicks,
        baseScore,
        totalBonus,
        totalScore,
        hasCompleteScore,
      };
    })
    .sort((a, b) => {
      if (a.hasCompleteScore && !b.hasCompleteScore) return -1;
      if (!a.hasCompleteScore && b.hasCompleteScore) return 1;
      if (a.totalScore === null && b.totalScore === null) return 0;
      if (a.totalScore === null) return 1;
      if (b.totalScore === null) return -1;
      return Number(a.totalScore) - Number(b.totalScore);
    });

  return (
    <main className="min-h-screen bg-[#0d0f12] px-5 py-8 text-zinc-50">
      <div className="mx-auto max-w-md">
        <div className="mb-6 overflow-hidden rounded-[2rem] border border-zinc-700/70 bg-black">
          <img
            src="/pool-house-logo.png"
            alt="The Pool House"
            className="w-full"
          />
        </div>

        <div className="rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
          <p className="text-xs font-black uppercase text-amber-300">
            Leaderboard
          </p>
          <h1 className="mt-3 text-3xl font-black">{pool.title}</h1>
          <p className="mt-2 text-sm text-zinc-400">
            {isGolfPool
              ? "Lowest total wins. Golfers are scored by tournament position, minus eligible bonuses."
              : "Leaderboard for this pool."}
          </p>
        </div>

        <div className="mt-5 space-y-3">
          {standings.length === 0 ? (
            <div className="rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
              <p className="font-black">No entries yet.</p>
            </div>
          ) : (
            standings.map((standing, index) => (
              <details
                key={standing.entry.id}
                className="group rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5"
              >
                <summary className="cursor-pointer list-none">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-black uppercase text-zinc-400">
                        #{index + 1}
                      </p>
                      <h2 className="mt-1 text-xl font-black">
                        {standing.entry.entryName}
                      </h2>
                      <p className="mt-1 text-sm text-zinc-400">
                        {standing.entry.participantName}
                      </p>
                      <p className="mt-2 text-xs font-black uppercase text-amber-300">
                        Tap to view picks
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-3xl font-black text-emerald-300">
                        {standing.totalScore ?? "—"}
                      </p>
                      <p className="text-xs uppercase text-zinc-500">
                        {isGolfPool ? "Final Score" : "Score"}
                      </p>
                    </div>
                  </div>
                </summary>

                <div className="mt-4 space-y-2 border-t border-zinc-700 pt-4">
                  {isGolfPool && (
                    <div className="mb-3 rounded-2xl border border-zinc-700 bg-zinc-900 p-3 text-xs text-zinc-300">
                      <div className="flex justify-between">
                        <span>Base position score</span>
                        <span className="font-bold">{standing.baseScore ?? "—"}</span>
                      </div>
                      <div className="mt-1 flex justify-between">
                        <span>Bonuses</span>
                        <span className="font-bold">
                          {standing.totalBonus > 0 ? `-${standing.totalBonus}` : "0"}
                        </span>
                      </div>
                    </div>
                  )}

                  {standing.selectedPicks.length === 0 ? (
                    <p className="text-sm text-zinc-400">No picks saved.</p>
                  ) : (
                    standing.selectedPicks.map((pick) => (
                      <div
                        key={pick.name}
                        className="flex justify-between gap-4 text-sm"
                      >
                        <span className="text-zinc-300">{pick.name}</span>

                        {isGolfPool && (
                          <span className="font-bold text-zinc-100">
                            {pick.displayPosition ?? pick.position ?? "—"}
                            {pick.bonus > 0 ? ` / -${pick.bonus}` : ""}
                          </span>
                        )}
                      </div>
                    ))
                  )}

                  <Link
                    href={`/entries/${standing.entry.id}`}
                    className="mt-4 block rounded-2xl border border-zinc-700 px-4 py-3 text-center text-xs font-black uppercase text-amber-300"
                  >
                    View Entry
                  </Link>
                </div>
              </details>
            ))
          )}
        </div>

        <Link
          href={`/pools/${pool.slug}`}
          className="mt-5 block w-full rounded-2xl bg-zinc-100 px-4 py-4 text-center text-sm font-black uppercase tracking-wide text-zinc-950"
        >
          Back to Pool
        </Link>
      </div>
    </main>
  );
}