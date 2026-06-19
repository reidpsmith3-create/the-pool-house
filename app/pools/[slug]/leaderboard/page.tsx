import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

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

  const optionById = new Map(options.map((option) => [option.id, option]));
  const resultByOptionId = new Map(
    results.map((result) => [result.pickOptionId, result])
  );

  const standings = poolEntries
    .map((entry) => {
      const entryPickRows = picks.filter((pick) => pick.entryId === entry.id);

      const selectedGolfers = entryPickRows.map((pick) => {
        const option = optionById.get(pick.pickOptionId);
        const result = resultByOptionId.get(pick.pickOptionId);

        return {
          name: option?.displayName ?? option?.name ?? "Unknown",
          position: result?.position ?? null,
          score: Number(result?.scoreValue ?? 0),
        };
      });

      const totalScore = selectedGolfers.reduce(
        (sum, golfer) => sum + golfer.score,
        0
      );

      return {
        entry,
        selectedGolfers,
        totalScore,
        hasCompleteScore:
          selectedGolfers.length > 0 &&
          selectedGolfers.every((golfer) => golfer.position !== null),
      };
    })
    .sort((a, b) => {
      if (a.hasCompleteScore && !b.hasCompleteScore) return -1;
      if (!a.hasCompleteScore && b.hasCompleteScore) return 1;
      return a.totalScore - b.totalScore;
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
            Lower score wins. Golfers are scored by current tournament place.
          </p>
        </div>

        <div className="mt-5 space-y-3">
          {standings.length === 0 ? (
            <div className="rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
              <p className="font-black">No entries yet.</p>
            </div>
          ) : (
            standings.map((standing, index) => (
              <Link
                key={standing.entry.id}
                href={`/entries/${standing.entry.id}`}
                className="block rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5"
              >
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
                  </div>

                  <div className="text-right">
                    <p className="text-3xl font-black text-emerald-300">
                      {standing.hasCompleteScore ? standing.totalScore : "—"}
                    </p>
                    <p className="text-xs uppercase text-zinc-500">Score</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 border-t border-zinc-700 pt-4">
                  {standing.selectedGolfers.map((golfer) => (
                    <div
                      key={golfer.name}
                      className="flex justify-between gap-4 text-sm"
                    >
                      <span className="text-zinc-300">{golfer.name}</span>
                      <span className="font-bold text-zinc-100">
                        {golfer.position ? golfer.position : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </Link>
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