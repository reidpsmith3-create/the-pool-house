import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { pools } from "@/db/schema";

export const dynamic = "force-dynamic";

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

export default async function Home() {
  const activePools = await db
    .select()
    .from(pools)
    .where(
      inArray(pools.status, ["open", "upcoming", "live"])
    )
    .orderBy(desc(pools.createdAt))
    .limit(3);

  const livePools = activePools.filter((pool) => pool.status === "live");
  const featuredLivePool = livePools[0] ?? null;

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

          {featuredLivePool ? (
            <article className="rounded-[2rem] border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5 shadow-xl shadow-black/30">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black">
                    {featuredLivePool.title}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    ${featuredLivePool.entryFee ?? "0.00"} entry ·{" "}
                    {featuredLivePool.maxEntriesPerUser} max entry
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Live scoring coming soon
                  </p>
                </div>
                <span className="rounded-full bg-emerald-400 px-4 py-1.5 text-[11px] font-black uppercase text-zinc-950">
                  Live
                </span>
              </div>

              <div className="rounded-2xl border border-zinc-700/70 bg-black/20 p-4 text-sm text-zinc-400">
                Live leaderboard will appear here once scoring is connected.
              </div>

              <Link
                href={`/pools/${featuredLivePool.slug}`}
                className="mt-5 block w-full rounded-2xl bg-zinc-100 px-4 py-4 text-center text-sm font-black uppercase tracking-wide text-zinc-950"
              >
                View Pool
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
                    className={`absolute bottom-0 left-0 top-0 w-1.5 ${getPoolAccent(pool.poolType)}`}
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