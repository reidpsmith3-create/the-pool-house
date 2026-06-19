import Link from "next/link";
import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { pools } from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";

export default async function AdminPage() {
  const isAdmin = await getIsAdmin();

  if (!isAdmin) {
    redirect("/");
  }

  const allPools = await db
    .select()
    .from(pools)
    .orderBy(desc(pools.updatedAt));

  return (
    <main className="min-h-screen bg-[#0d0f12] px-5 py-8 text-zinc-50">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-black">Admin</h1>

        <p className="mt-2 text-sm text-zinc-400">
          Manage pools, entries, scoring, and settings.
        </p>

        <div className="mt-8 space-y-3">
          <Link
            href="/admin/pools/new"
            className="block rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5"
          >
            <p className="text-xl font-black">Create Pool</p>
            <p className="mt-1 text-sm text-zinc-400">
              Build and publish a new pool.
            </p>
          </Link>
        </div>

        <div className="mt-8">
          <h2 className="mb-3 text-lg font-black">Pools</h2>

          <div className="space-y-3">
            {allPools.length === 0 ? (
              <div className="rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
                No pools yet.
              </div>
            ) : (
              allPools.map((pool) => (
                <div
                  key={pool.id}
                  className="rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-black">{pool.title}</p>

                      <p className="mt-1 text-sm text-zinc-400">
                        {pool.poolType}
                      </p>

                      <p className="mt-2 text-xs font-black uppercase text-amber-300">
                        {pool.status}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <Link
                      href={`/pools/${pool.slug}`}
                      className="rounded-xl bg-zinc-800 px-3 py-2 text-center text-xs font-bold"
                    >
                      View
                    </Link>

                    <Link
                      href={`/admin/pools/${pool.slug}/edit`}
                      className="rounded-xl bg-zinc-800 px-3 py-2 text-center text-xs font-bold"
                    >
                      Edit
                    </Link>

                    <Link
                      href={`/admin/pools/${pool.slug}/golf/scores`}
                      className="rounded-xl bg-zinc-800 px-3 py-2 text-center text-xs font-bold"
                    >
                      Scores
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}