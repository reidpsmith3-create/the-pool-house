import Link from "next/link";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { entries, pools } from "@/db/schema";
import { getCurrentUser, getIsAdmin } from "@/lib/auth-helpers";

export default async function MyEntriesPage() {
  const currentUser = await getCurrentUser();
  const isAdmin = await getIsAdmin();

  if (!currentUser) {
    redirect("/api/auth/signin");
  }

  const myEntries = await db
    .select({
      entry: entries,
      pool: pools,
    })
    .from(entries)
    .innerJoin(pools, eq(entries.poolId, pools.id))
    .where(eq(entries.userId, currentUser.id));

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

        <h1 className="text-3xl font-black">My Entries</h1>

        <p className="mt-2 text-sm text-zinc-400">
          All of your pool entries.
        </p>

        {isAdmin && (
          <Link
            href="/admin"
            className="mt-5 block rounded-2xl bg-amber-300 px-4 py-4 text-center text-sm font-black uppercase tracking-wide text-zinc-950"
          >
            Admin Dashboard
          </Link>
        )}

        <div className="mt-6 space-y-3">
          {myEntries.length === 0 ? (
            <div className="rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
              <p className="font-black">No entries yet.</p>
              <p className="mt-2 text-sm text-zinc-400">
                Join a pool to get started.
              </p>
            </div>
          ) : (
            myEntries.map(({ entry, pool }) => (
              <Link
                key={entry.id}
                href={`/entries/${entry.id}`}
                className="block rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5"
              >
                <p className="text-xs font-black uppercase text-amber-300">
                  {pool.poolType}
                </p>

                <h2 className="mt-2 text-xl font-black">{pool.title}</h2>

                <p className="mt-2 text-sm text-zinc-400">{entry.entryName}</p>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs uppercase text-zinc-500">
                    {entry.isPaid ? "Paid" : "Unpaid"}
                  </span>

                  <span className="text-sm font-black text-amber-300">
                    View →
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}