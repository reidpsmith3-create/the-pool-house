import Link from "next/link";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { pools } from "@/db/schema";

export default async function HistoryPage() {
  const completedPools = await db
    .select()
    .from(pools)
    .where(eq(pools.status, "completed"))
    .orderBy(desc(pools.completedAt));

  return (
    <main className="min-h-screen bg-[#0d0f12] px-5 pb-24 pt-5 text-zinc-50">
      <div className="mx-auto max-w-md">
        <header className="mb-6 overflow-hidden rounded-[2rem] border border-zinc-700/70 bg-black">
          <img
            src="/pool-house-logo.png"
            alt="The Pool House"
            className="w-full"
          />
        </header>

        <h1 className="text-3xl font-black">History</h1>

        <p className="mt-2 text-sm text-zinc-400">
          Completed pools and past champions.
        </p>

        <div className="mt-6 space-y-3">
          {completedPools.length === 0 ? (
            <div className="rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
              <p className="font-black">No completed pools yet.</p>
              <p className="mt-2 text-sm text-zinc-400">
                Finished pools will show up here.
              </p>
            </div>
          ) : (
            completedPools.map((pool) => (
              <Link
                key={pool.id}
                href={`/pools/${pool.slug}/leaderboard`}
                className="block rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase text-amber-300">
  {pool.poolType}
</p>

                    <h2 className="mt-2 text-xl font-black">
                      {pool.title}
                    </h2>

                    <p className="mt-3 text-lg font-bold text-emerald-300">
                      🏆 {pool.winnerName ?? "Unknown Winner"}
                    </p>

                    {pool.completedAt && (
                      <p className="mt-2 text-sm text-zinc-500">
                        Completed{" "}
                        {new Date(pool.completedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="text-3xl text-zinc-600">
                    ›
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}