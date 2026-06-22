import Link from "next/link";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { entries, pools } from "@/db/schema";

export const dynamic = "force-dynamic";

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: "Draft",
    upcoming: "Upcoming",
    open: "Open",
    live: "Live",
    completed: "Completed",
    archived: "Archived",
  };

  return labels[status] ?? status;
}
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

function PoolCard({
  pool,
  entryCount,
}: {
  pool: typeof pools.$inferSelect;
  entryCount: number;
}) {
  const prizePool = Number(pool.entryFee ?? 0) * entryCount;

  return (
    <Link
      href={
        pool.status === "live"
          ? `/pools/${pool.slug}/leaderboard`
          : `/pools/${pool.slug}`
      }
      className="block rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5"
    >
<div className="flex items-start justify-between gap-4">
  <div className="flex min-w-0 flex-1 gap-4">
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

    <div className="min-w-0">
      <p className="text-xs font-black uppercase text-amber-300">
        {pool.poolType}
      </p>

      <h3 className="mt-2 text-xl font-black">{pool.title}</h3>

      {pool.description && (
        <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
          {pool.description}
        </p>
      )}
    </div>
  </div>

  <span className="shrink-0 rounded-full bg-black/25 px-3 py-1.5 text-xs font-black uppercase text-emerald-300">
    {getStatusLabel(pool.status)}
  </span>
</div>
      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-zinc-700 pt-4 text-sm">
        <div>
          <p className="font-black text-zinc-100">{entryCount}</p>
          <p className="text-xs text-zinc-500">Entries</p>
        </div>

        <div>
          <p className="font-black text-zinc-100">${pool.entryFee ?? "0.00"}</p>
          <p className="text-xs text-zinc-500">Entry</p>
        </div>

        <div>
          <p className="font-black text-zinc-100">${prizePool.toFixed(2)}</p>
          <p className="text-xs text-zinc-500">Prize</p>
        </div>
      </div>
    </Link>
  );
}

export default async function PoolsPage() {
  const publishedPools = await db
    .select()
    .from(pools)
    .where(eq(pools.isPublished, true))
    .orderBy(desc(pools.createdAt));

  const allEntries = await db.select().from(entries);

  const entryCountByPoolId = new Map<string, number>();

  for (const entry of allEntries) {
    entryCountByPoolId.set(
      entry.poolId,
      (entryCountByPoolId.get(entry.poolId) ?? 0) + 1
    );
  }

  const livePools = publishedPools.filter((pool) => pool.status === "live");
  const openPools = publishedPools.filter((pool) => pool.status === "open");
  const upcomingPools = publishedPools.filter(
    (pool) => pool.status === "upcoming"
  );
  const completedPools = publishedPools.filter(
    (pool) => pool.status === "completed"
  );
  const archivedPools = publishedPools.filter(
  (pool) => pool.status === "archived"
);

  const tabs = [
    ["Live", livePools.length],
    ["Open", openPools.length],
    ["Upcoming", upcomingPools.length],
    ["Completed", completedPools.length],
  ];

  return (
    <main className="min-h-screen bg-[#0d0f12] px-5 pb-24 pt-5 text-zinc-50">
      <div className="mx-auto max-w-md">
        <header className="mb-7 overflow-hidden rounded-[2rem] border border-zinc-700/70 bg-black shadow-2xl shadow-black/40">
          <img
            src="/pool-house-logo.png"
            alt="The Pool House"
            className="w-full"
          />
        </header>

        <h1 className="text-3xl font-black">Pools</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Browse open, live, upcoming, and completed pools.
        </p>

        <div className="mt-5 grid grid-cols-4 gap-2">
          {tabs.map(([label, count]) => (
            <div
              key={label}
              className="rounded-2xl border border-zinc-700/70 bg-zinc-900 p-3 text-center"
            >
              <p className="text-lg font-black">{count}</p>
              <p className="mt-1 text-[10px] font-black uppercase text-zinc-500">
                {label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-8">
          {livePools.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide">
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                Live
              </h2>

              <div className="space-y-3">
                {livePools.map((pool) => (
                  <PoolCard
                    key={pool.id}
                    pool={pool}
                    entryCount={entryCountByPoolId.get(pool.id) ?? 0}
                  />
                ))}
              </div>
            </section>
          )}

          {openPools.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-black uppercase tracking-wide">
                Open Pools
              </h2>

              <div className="space-y-3">
                {openPools.map((pool) => (
                  <PoolCard
                    key={pool.id}
                    pool={pool}
                    entryCount={entryCountByPoolId.get(pool.id) ?? 0}
                  />
                ))}
              </div>
            </section>
          )}

          {upcomingPools.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-black uppercase tracking-wide">
                Upcoming
              </h2>

              <div className="space-y-3">
                {upcomingPools.map((pool) => (
                  <PoolCard
                    key={pool.id}
                    pool={pool}
                    entryCount={entryCountByPoolId.get(pool.id) ?? 0}
                  />
                ))}
              </div>
            </section>
          )}

          {completedPools.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-black uppercase tracking-wide">
                Completed
              </h2>

              <div className="space-y-3">
                {completedPools.map((pool) => (
                  <PoolCard
                    key={pool.id}
                    pool={pool}
                    entryCount={entryCountByPoolId.get(pool.id) ?? 0}
                  />
                ))}
              </div>
            </section>
          )}
{archivedPools.length > 0 && (
  <section>
    <h2 className="mb-3 text-sm font-black uppercase tracking-wide">
      Archived
    </h2>

    <div className="space-y-3">
      {archivedPools.map((pool) => (
        <PoolCard
          key={pool.id}
          pool={pool}
          entryCount={entryCountByPoolId.get(pool.id) ?? 0}
        />
      ))}
    </div>
  </section>
)}
          {publishedPools.length === 0 && (
            <div className="rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
              <p className="font-black">No published pools yet.</p>
              <p className="mt-2 text-sm text-zinc-400">
                Published pools will show up here.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}