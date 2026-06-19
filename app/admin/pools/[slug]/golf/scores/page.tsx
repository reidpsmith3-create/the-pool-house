import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  leaderboardResults,
  leaderboardSources,
  pickOptions,
  pools,
} from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
  syncTodo?: string;
  sourceSaved?: string;
  sourceMissing?: string;
  syncFailed?: string;
}>;
};

export default async function GolfScoresPage({
  params,
  searchParams,
}: PageProps) {
  const isAdmin = await getIsAdmin();

  if (!isAdmin) redirect("/");

  const { slug } = await params;
  const {
  syncTodo,
  sourceSaved,
  sourceMissing,
  syncFailed,
} = await searchParams;

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

  const results = await db
    .select()
    .from(leaderboardResults)
    .where(eq(leaderboardResults.poolId, pool.id));

  const sources = await db
    .select()
    .from(leaderboardSources)
    .where(eq(leaderboardSources.poolId, pool.id));

  const activeSource = sources.find((source) => source.isActive) ?? null;

  const resultByPickOptionId = new Map(
    results.map((result) => [result.pickOptionId, result])
  );

  return (
    <main className="min-h-screen bg-[#0d0f12] px-5 py-8 text-zinc-50">
      <div className="mx-auto max-w-md">
        <p className="text-xs font-black uppercase text-amber-300">
          Admin · Golf Leaderboard Import
        </p>
        <h1 className="mt-3 text-3xl font-black">Import Places</h1>
        <p className="mt-2 text-sm text-zinc-400">{pool.title}</p>

        {syncTodo === "1" && (
          <div className="mt-5 rounded-3xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
            <p className="font-black">Sync route is connected.</p>
            <p className="mt-1 text-zinc-300">
              Next we’ll wire this to the saved leaderboard source.
            </p>
          </div>
        )}

        {sourceSaved === "1" && (
          <div className="mt-5 rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-200">
            Leaderboard source saved.
          </div>
        )}

        {sourceMissing === "1" && (
          <div className="mt-5 rounded-3xl border border-red-500/40 bg-red-500/10 p-4 text-sm font-bold text-red-200">
            Org ID, Tournament ID, and Year are required.
          </div>
        )}
        {syncFailed === "1" && (
  <div className="mt-5 rounded-3xl border border-red-500/40 bg-red-500/10 p-4 text-sm font-bold text-red-200">
    Leaderboard sync failed. Check your RapidAPI key and tournament settings.
  </div>
)}

 <div className="mt-5 rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
  <h2 className="text-lg font-black">Leaderboard Source</h2>

  <p className="mt-2 text-sm text-zinc-400">
    Enter the RapidAPI Live Golf Data tournament values for this pool.
  </p>

  <form
    action={`/api/admin/pools/${pool.slug}/golf/source`}
    method="post"
    className="mt-4 space-y-4"
  >
    <div className="grid grid-cols-3 gap-3">
      <label className="block">
        <span className="text-sm font-bold">Org ID</span>
        <input
          name="orgId"
          defaultValue="1"
          placeholder="1"
          className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-zinc-50 outline-none"
        />
      </label>

      <label className="block">
        <span className="text-sm font-bold">Tourn ID</span>
        <input
          name="tournId"
          placeholder="475"
          className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-zinc-50 outline-none"
        />
      </label>

      <label className="block">
        <span className="text-sm font-bold">Year</span>
        <input
          name="year"
          placeholder="2026"
          className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-zinc-50 outline-none"
        />
      </label>
    </div>

    {activeSource && (
      <p className="break-all rounded-2xl border border-zinc-700 bg-black/30 p-3 text-xs text-zinc-400">
        Current source: {activeSource.sourceUrl}
      </p>
    )}

    <button className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-black uppercase text-amber-300">
      Save Tournament Source
    </button>
  </form>
</div>

        <div className="mt-5 rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-5">
          <h2 className="text-lg font-black text-emerald-200">
            Auto Import Scores
          </h2>

          <p className="mt-2 text-sm text-zinc-300">
            Pull the latest leaderboard from the configured golf source and
            update golfer positions.
          </p>

          {activeSource ? (
            <p className="mt-2 break-all text-xs text-zinc-400">
              Active source: {activeSource.sourceUrl}
            </p>
          ) : (
            <p className="mt-2 text-xs font-bold uppercase text-amber-200">
              No source saved yet.
            </p>
          )}
          {activeSource && (
  <form
    action={`/api/admin/pools/${pool.slug}/golf/source/toggle-auto-sync`}
    method="post"
    className="mt-4 rounded-2xl border border-zinc-700 bg-zinc-900 p-4"
  >
    <label className="flex items-center gap-3">
      <input
        name="autoSyncEnabled"
        type="checkbox"
        defaultChecked={activeSource.autoSyncEnabled}
      />
      <span className="text-sm font-bold">
        Automatic hourly syncing enabled
      </span>
    </label>

    <button className="mt-4 w-full rounded-2xl border border-zinc-700 bg-black/30 px-4 py-3 text-xs font-black uppercase text-amber-300">
      Save Auto Sync Setting
    </button>
  </form>
)}

          <form
            action={`/api/admin/pools/${pool.slug}/golf/scores/sync`}
            method="post"
            className="mt-4"
          >
            <button className="w-full rounded-2xl bg-emerald-300 px-4 py-4 text-sm font-black uppercase tracking-wide text-zinc-950">
              Sync Leaderboard
            </button>
          </form>
        </div>

        <div className="mt-5 rounded-3xl border border-amber-500/40 bg-amber-500/10 p-4">
          <p className="text-sm font-black text-amber-200">
            Enter tournament finishing position only.
          </p>
          <p className="mt-2 text-sm text-zinc-300">
            Example: Scottie in 1st = <span className="font-bold">1</span>, Rory
            in T4 = <span className="font-bold">4</span>. The Pool House adds
            the positions together. Lowest total wins.
          </p>
          <p className="mt-2 text-xs font-bold uppercase text-zinc-400">
            Do not enter score-to-par here.
          </p>
        </div>

        <form
          action={`/api/admin/pools/${pool.slug}/golf/scores`}
          method="post"
          className="mt-6 space-y-4"
        >
          {golfers.map((golfer) => {
            const result = resultByPickOptionId.get(golfer.id);

            return (
              <div
                key={golfer.id}
                className="rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-4"
              >
                <p className="font-black">{golfer.displayName ?? golfer.name}</p>

                <input type="hidden" name="pickOptionId" value={golfer.id} />

                <label className="mt-3 block">
                  <span className="text-sm font-bold text-zinc-300">
                    Current Place / Position
                  </span>
                  <input
                    name={`position-${golfer.id}`}
                    type="number"
                    min="1"
                    defaultValue={result?.position ?? ""}
                    placeholder="1"
                    className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
                  />
                </label>

                <p className="mt-2 text-xs text-zinc-500">
                  Use the numeric place only. For T5, enter 5.
                </p>
              </div>
            );
          })}

          <button className="w-full rounded-2xl bg-amber-300 px-4 py-4 text-sm font-black uppercase tracking-wide text-zinc-950">
            Save Places
          </button>
        </form>
      </div>
    </main>
  );
}