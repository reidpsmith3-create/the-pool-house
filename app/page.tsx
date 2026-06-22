import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  entries,
  entryPicks,
  leaderboardResults,
  leaderboardSources,
  pickOptions,
  pools,
} from "@/db/schema";
import {
  calculateGolfEntryScore,
  getGolfBonus,
  type GolfScoringSettings,
} from "@/lib/scoring/golf";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    livePool?: string;
  }>;
};

function getPoolIcon(poolType: string) {
  const icons: Record<string, string> = {
    golf: "⛳",
    survivor: "🏈",
    pickem: "🏈",
    bracket: "🏀",
    predictions: "🔮",
  };

  return icons[poolType] ?? "🎯";
}

function getPoolAccent(poolType: string) {
  const accents: Record<string, string> = {
    golf: "bg-emerald-500",
    survivor: "bg-blue-500",
    pickem: "bg-blue-500",
    bracket: "bg-orange-500",
    predictions: "bg-purple-500",
  };

  return accents[poolType] ?? "bg-amber-400";
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: "Draft",
    upcoming: "Soon",
    open: "Open",
    live: "Live",
    completed: "Done",
    archived: "Archived",
  };

  return labels[status] ?? status;
}

async function getGolfHomepageStandings(pool: typeof pools.$inferSelect) {
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

  const results = await db
    .select()
    .from(leaderboardResults)
    .where(eq(leaderboardResults.poolId, pool.id));

  const sourceRows = await db
    .select()
    .from(leaderboardSources)
    .where(eq(leaderboardSources.poolId, pool.id));

  const activeSource = sourceRows.find((source) => source.isActive);

  const optionById = new Map(options.map((option) => [option.id, option]));
  const resultByOptionId = new Map(
    results.map((result) => [result.pickOptionId, result])
  );

  const standings = poolEntries
    .map((entry) => {
      const entryPickRows = picks.filter((pick) => pick.entryId === entry.id);

      const selectedPicks = entryPickRows.map((pick) => {
        const option = optionById.get(pick.pickOptionId);
        const result = resultByOptionId.get(pick.pickOptionId);
        const position = result?.position ?? null;
        const bonus =
          typeof position === "number"
            ? getGolfBonus(position, golfScoringSettings)
            : 0;

        return {
          name: option?.displayName ?? option?.name ?? "Unknown",
          position,
          displayPosition: result?.displayPosition ?? null,
          bonus,
          score: typeof position === "number" ? position - bonus : null,
        };
      });

      const golfScore = calculateGolfEntryScore(
        selectedPicks.map((pick) => ({
          position: pick.position,
          bonus: pick.bonus,
          score: pick.score,
        })),
        golfScoringSettings
      );

      return {
        entry,
        selectedPicks,
        totalScore: golfScore.totalScore,
        hasCompleteScore: golfScore.hasCompleteScore,
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

  return {
    standings,
    activeSource,
  };
}

export default async function Home({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedLivePoolSlug = resolvedSearchParams.livePool;

  const activePools = await db
    .select()
    .from(pools)
    .where(inArray(pools.status, ["open", "upcoming", "live"]))
    .orderBy(desc(pools.createdAt))
    .limit(3);

  const livePools = await db
    .select()
    .from(pools)
    .where(eq(pools.status, "live"))
    .orderBy(desc(pools.updatedAt));

  const selectedLivePool =
    livePools.find((pool) => pool.slug === selectedLivePoolSlug) ??
    livePools[0] ??
    null;

  const selectedLivePoolData =
    selectedLivePool?.poolType === "golf"
      ? await getGolfHomepageStandings(selectedLivePool)
      : null;

  const recentCompletedPools = await db
    .select()
    .from(pools)
    .where(eq(pools.status, "completed"))
    .orderBy(desc(pools.updatedAt))
    .limit(3);

  return (
    <main className="min-h-screen bg-[#0d0f12] text-zinc-50">
      <div className="mx-auto min-h-screen w-full max-w-md px-5 pb-24 pt-5">
        <header className="mb-8 overflow-hidden rounded-[2rem] border border-zinc-700/70 bg-black shadow-2xl shadow-black/40">
          <img
            src="/pool-house-logo.png"
            alt="The Pool House"
            className="w-full"
          />
        </header>

        <section className="mb-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide">
              <span className="h-3 w-3 rounded-full bg-emerald-400" />
              Live Now
            </h2>
          </div>

          {selectedLivePool ? (
            <article className="rounded-[2rem] border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5 shadow-xl shadow-black/30">
              {livePools.length > 1 && (
                <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                  {livePools.map((pool) => {
                    const isSelected = pool.id === selectedLivePool.id;

                    return (
                      <Link
                        key={pool.id}
                        href={`/?livePool=${pool.slug}`}
                        className={
                          isSelected
                            ? "shrink-0 rounded-full bg-emerald-400 px-4 py-2 text-xs font-black uppercase text-zinc-950"
                            : "shrink-0 rounded-full bg-black/30 px-4 py-2 text-xs font-black uppercase text-zinc-400"
                        }
                      >
                        {pool.title}
                      </Link>
                    );
                  })}
                </div>
              )}

              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex min-w-0 gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-black/30 text-2xl">
                    {selectedLivePool.logoUrl ? (
                      <img
                        src={selectedLivePool.logoUrl}
                        alt={`${selectedLivePool.title} logo`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getPoolIcon(selectedLivePool.poolType)
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-xl font-black">
                      {selectedLivePool.title}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-400">
                      ${selectedLivePool.entryFee ?? "0.00"} entry ·{" "}
                      {selectedLivePool.maxEntriesPerUser} max entry
                    </p>

                    {selectedLivePool.poolType === "golf" &&
                      selectedLivePoolData?.activeSource?.lastSyncedAt && (
                        <p className="mt-1 text-xs text-zinc-500">
                          Updated{" "}
                          {new Intl.DateTimeFormat("en-US", {
                            timeZone: "America/Chicago",
                            month: "numeric",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          }).format(
                            new Date(
                              selectedLivePoolData.activeSource.lastSyncedAt
                            )
                          )}{" "}
                          CT
                        </p>
                      )}
                  </div>
                </div>

                <span className="shrink-0 rounded-full bg-emerald-400 px-4 py-1.5 text-[11px] font-black uppercase text-zinc-950">
                  Live
                </span>
              </div>

              {selectedLivePool.poolType === "golf" && selectedLivePoolData ? (
                <div className="rounded-2xl border border-zinc-700/70 bg-black/20 p-4">
                  {selectedLivePoolData.standings.length === 0 ? (
                    <p className="text-sm text-zinc-400">
                      No entries are on the leaderboard yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedLivePoolData.standings
                        .slice(0, 5)
                        .map((standing, index) => (
                          <div
                            key={standing.entry.id}
                            className="flex items-center justify-between gap-4"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black">
                                #{index + 1} {standing.entry.entryName}
                              </p>
                              <p className="truncate text-xs text-zinc-500">
                                {standing.entry.participantName}
                              </p>
                            </div>

                            <p className="shrink-0 text-xl font-black text-emerald-300">
                              {standing.totalScore ?? "—"}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-zinc-700/70 bg-black/20 p-4 text-sm text-zinc-400">
                  Live leaderboard preview is not set up for this pool type yet.
                </div>
              )}

              <Link
                href={`/pools/${selectedLivePool.slug}/leaderboard`}
                className="mt-5 block w-full rounded-2xl bg-zinc-100 px-4 py-4 text-center text-sm font-black uppercase tracking-wide text-zinc-950"
              >
                View Full Leaderboard
              </Link>
            </article>
          ) : (
            <article className="rounded-[2rem] border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5 shadow-xl shadow-black/30">
              <p className="font-black">No live pools right now.</p>
              <p className="mt-2 text-sm text-zinc-400">
                Live standings will appear here once a pool is underway.
              </p>
            </article>
          )}
        </section>

        <section className="mb-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wide">
              Active Pools
            </h2>
            <Link
              href="/pools"
              className="text-xs font-black uppercase text-amber-300"
            >
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {activePools.length > 0 ? (
              activePools.map((pool) => (
                <Link
                  href={`/pools/${pool.slug}`}
                  key={pool.id}
                  className="relative block overflow-hidden rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-4"
                >
                  <div
                    className={`absolute bottom-0 left-0 top-0 w-1.5 ${getPoolAccent(
                      pool.poolType
                    )}`}
                  />
                  <div className="flex gap-4 pl-2">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-black/30 text-2xl">
                      {pool.logoUrl ? (
                        <img
                          src={pool.logoUrl}
                          alt={`${pool.title} logo`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        getPoolIcon(pool.poolType)
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-black leading-snug">
                        {pool.title}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-400">
                        ${pool.entryFee ?? "0.00"} entry ·{" "}
                        {pool.maxEntriesPerUser} max entry
                      </p>
                      <span className="mt-3 inline-flex rounded-full bg-black/25 px-3 py-1.5 text-xs font-black uppercase text-emerald-300">
                        {getStatusLabel(pool.status)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <article className="rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
                <p className="font-black">No active pools yet.</p>
                <p className="mt-2 text-sm text-zinc-400">
                  Open and upcoming pools will show up here.
                </p>
              </article>
            )}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wide">
              Recent Champions
            </h2>
          </div>

          <div className="space-y-3">
            {recentCompletedPools.length > 0 ? (
              recentCompletedPools.map((pool) => (
                <Link
                  href={`/pools/${pool.slug}/leaderboard`}
                  key={pool.id}
                  className="flex items-center gap-4 rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-4"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-black/30 text-2xl">
                    {pool.logoUrl ? (
                      <img
                        src={pool.logoUrl}
                        alt={`${pool.title} logo`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      "🏆"
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-black">{pool.title}</p>
                    <p className="mt-1 text-sm font-bold text-amber-300">
                      🏆 {pool.winnerName ?? "Unknown Winner"}
                    </p>
                  </div>

                  <span className="text-2xl text-zinc-500">›</span>
                </Link>
              ))
            ) : (
              <article className="rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
                <p className="font-black">No champions yet.</p>
                <p className="mt-2 text-sm text-zinc-400">
                  Completed pools will appear here.
                </p>
              </article>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}