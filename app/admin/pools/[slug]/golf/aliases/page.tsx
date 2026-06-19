import Link from "next/link";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { pickOptions, pools } from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    unmatched?: string;
    matched?: string;
    saved?: string;
  }>;
};

export default async function GolfAliasesPage({
  params,
  searchParams,
}: PageProps) {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/");

  const { slug } = await params;
  const { unmatched, matched, saved } = await searchParams;

  const poolRows = await db
    .select()
    .from(pools)
    .where(eq(pools.slug, slug))
    .limit(1);

  const pool = poolRows[0];
  if (!pool) redirect("/admin");

  const golfers = await db
    .select()
    .from(pickOptions)
    .where(eq(pickOptions.poolId, pool.id));

  let unmatchedNames: string[] = [];

  try {
    unmatchedNames = unmatched
      ? (JSON.parse(decodeURIComponent(unmatched)) as string[])
      : [];
  } catch {
    unmatchedNames = [];
  }

  return (
    <main className="min-h-screen bg-[#0d0f12] px-5 py-8 text-zinc-50">
      <div className="mx-auto max-w-md">
        <p className="text-xs font-black uppercase text-amber-300">
          Admin · Golf Name Matching
        </p>
        <h1 className="mt-3 text-3xl font-black">Match Golfers</h1>
        <p className="mt-2 text-sm text-zinc-400">{pool.title}</p>

        {saved === "1" && (
          <div className="mt-5 rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-200">
            Name matches saved.
          </div>
        )}

        {matched && (
          <div className="mt-5 rounded-3xl border border-zinc-700/70 bg-zinc-900 p-4 text-sm text-zinc-300">
            Matched {matched} golfers automatically. Match the remaining names
            below, then run sync again.
          </div>
        )}

        {unmatchedNames.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
            <p className="font-black">No unmatched golfers.</p>
            <p className="mt-2 text-sm text-zinc-400">
              Run the leaderboard sync to find names that need matching.
            </p>
          </div>
        ) : (
          <form
            action={`/api/admin/pools/${pool.slug}/golf/aliases`}
            method="post"
            className="mt-6 space-y-4"
          >
            {unmatchedNames.map((sourceName) => (
              <div
                key={sourceName}
                className="rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5"
              >
                <p className="text-xs font-black uppercase text-zinc-500">
                  Source Name
                </p>
                <p className="mt-1 text-lg font-black">{sourceName}</p>

                <input type="hidden" name="sourceName" value={sourceName} />

                <label className="mt-4 block">
                  <span className="text-sm font-bold">Match To</span>
                  <select
                    name={`pickOptionId-${sourceName}`}
                    required
                    className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select golfer
                    </option>
                    {golfers.map((golfer) => (
                      <option key={golfer.id} value={golfer.id}>
                        {golfer.displayName ?? golfer.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ))}

            <button className="w-full rounded-2xl bg-amber-300 px-4 py-4 text-sm font-black uppercase tracking-wide text-zinc-950">
              Save Matches
            </button>
          </form>
        )}

        <Link
          href={`/admin/pools/${pool.slug}/golf/scores`}
          className="mt-5 block rounded-2xl bg-zinc-100 px-4 py-4 text-center text-sm font-black uppercase tracking-wide text-zinc-950"
        >
          Back to Scores
        </Link>
      </div>
    </main>
  );
}