import Link from "next/link";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { pools } from "@/db/schema";

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

function PoolCard({ pool }: { pool: typeof pools.$inferSelect }) {
  return (
    <Link
      href={`/pools/${pool.slug}`}
      className="block rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5"
    >
      <div className="flex items-start justify-between gap-4">
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

        <span className="rounded-full bg-black/25 px-3 py-1.5 text-xs font-black uppercase text-emerald-300">
          {getStatusLabel(pool.status)}
        </span>
      </div>

      <div className="mt-4 flex justify-between border-t border-zinc-700 pt-4 text-sm text-zinc-400">
        <span>${pool.entryFee ?? "0.00"} entry</span>
        <span>{pool.maxEntriesPerUser} max</span>
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

  const livePools = publishedPools.filter((pool) => pool.status === "live");
  const openPools = publishedPools.filter((pool) => pool.status === "open");
  const upcomingPools = publishedPools.filter(
    (pool) => pool.status === "upcoming"
  );
  const completedPools = publishedPools.filter(
    (pool) => pool.status === "completed"
  );

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

        <div className="mt-6 space-y-8">
          {livePools.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide">
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                Live
              </h2>

              <div className="space-y-3">
                {livePools.map((pool) => (
                  <PoolCard key={pool.id} pool={pool} />
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
                  <PoolCard key={pool.id} pool={pool} />
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
                  <PoolCard key={pool.id} pool={pool} />
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
                  <PoolCard key={pool.id} pool={pool} />
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

        <nav className="fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-[#0d0f12]/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto grid max-w-md grid-cols-4 text-center text-[11px] font-semibold text-zinc-500">
            <Link href="/" className="text-zinc-500">
              Home
            </Link>
            <Link href="/pools" className="text-amber-300">
              Pools
            </Link>
            <span>Live</span>
            <span>History</span>
          </div>
        </nav>
      </div>
    </main>
  );
}