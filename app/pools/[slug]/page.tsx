import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { entries, pools } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth-helpers";

type PageProps = {
  params: Promise<{
    slug: string;
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
export default async function PoolDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const currentUser = await getCurrentUser();

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

  const userEntryRows = currentUser
    ? poolEntries.filter((entry) => entry.userId === currentUser.id)
    : [];

  const userEntry = userEntryRows[0] ?? null;

  const prizePool =
    Number(pool.entryFee ?? 0) > 0
      ? Number(pool.entryFee) * poolEntries.length
      : 0;

  const canJoin = pool.status === "open";
  const isGolfPool = pool.poolType === "golf";

const scoringSettings =
  pool.scoringSettings && typeof pool.scoringSettings === "object"
    ? (pool.scoringSettings as {
        winnerBonus?: number;
        topFiveBonus?: number;
      })
    : {};

const winnerBonus = Number(scoringSettings.winnerBonus ?? 0);
const topFiveBonus = Number(scoringSettings.topFiveBonus ?? 0);

  return (
    <main className="min-h-screen bg-[#0d0f12] px-5 py-8 text-zinc-50">
      <div className="mx-auto max-w-md">
        <div className="mb-6 overflow-hidden rounded-[2rem] border border-zinc-700/70 bg-black">
          <img src="/pool-house-logo.png" alt="The Pool House" className="w-full" />
        </div>

        <div className="rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
<div className="mb-5 flex gap-5">
  <div className="shrink-0">
    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-black/30 text-4xl">
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

    <p className="mt-2 text-center text-xs font-black uppercase tracking-wide text-zinc-400">
      {pool.poolType}
    </p>
  </div>

  <div className="flex min-w-0 flex-1 flex-col justify-center">

    <h1 className="text-3xl font-black">{pool.title}</h1>

    {pool.description && (
      <p className="mt-3 text-zinc-300">{pool.description}</p>
    )}
  </div>
</div>

          <div className="space-y-3 border-t border-zinc-700 pt-5">
            <div className="flex justify-between">
              <span className="text-zinc-400">Entry Fee</span>
              <span>${pool.entryFee ?? "0.00"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Entries</span>
              <span>{poolEntries.length}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Prize Pool</span>
              <span>${prizePool.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Max Entries Per User</span>
              <span>{pool.maxEntriesPerUser}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Status</span>
              <span className="capitalize">{pool.status}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
          <h2 className="text-lg font-black">Pool Actions</h2>

          <div className="mt-4 space-y-3">
            <Link
              href={`/pools/${pool.slug}/leaderboard`}
              className="block rounded-2xl bg-zinc-100 px-4 py-4 text-center text-sm font-black uppercase tracking-wide text-zinc-950"
            >
              View Leaderboard
            </Link>

            {userEntry ? (
              <Link
                href={`/entries/${userEntry.id}`}
                className="block rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-4 text-center text-sm font-black uppercase tracking-wide text-amber-300"
              >
                View My Entry
              </Link>
            ) : canJoin ? (
              <form action={`/api/pools/${pool.slug}/join`} method="post">
                <button className="w-full rounded-2xl bg-amber-300 px-4 py-4 text-sm font-black uppercase tracking-wide text-zinc-950">
                  Join Pool
                </button>
              </form>
            ) : (
              <div className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-4 text-center text-sm font-black uppercase tracking-wide text-zinc-500">
                Joining Closed
              </div>
            )}
          </div>
        </div>
{isGolfPool && (
  <div className="mt-5 rounded-3xl border border-amber-500/40 bg-amber-500/10 p-5">
    <h2 className="text-lg font-black text-amber-200">Golf Scoring</h2>

    <p className="mt-2 text-sm text-zinc-300">
      Entries are scored by adding the tournament finishing positions of their
      selected golfers. Lowest final score wins.
    </p>

    <div className="mt-4 space-y-3 border-t border-amber-500/20 pt-4">
      <div className="flex justify-between">
        <span className="text-zinc-400">Winner Bonus</span>
        <span className="font-black">
          {winnerBonus > 0 ? `-${winnerBonus}` : "None"}
        </span>
      </div>

      <div className="flex justify-between">
        <span className="text-zinc-400">Top Five Bonus</span>
        <span className="font-black">
          {topFiveBonus > 0 ? `-${topFiveBonus}` : "None"}
        </span>
      </div>
    </div>

    <p className="mt-3 text-xs font-bold uppercase text-zinc-400">
      Bonuses do not stack. A tournament winner only receives the winner bonus.
    </p>
  </div>
)}
        {pool.rules && (
          <div className="mt-5 rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
            <h2 className="mb-3 text-lg font-black">Rules</h2>
            <div className="whitespace-pre-wrap text-zinc-300">{pool.rules}</div>
          </div>
        )}

        {userEntry && (
          <div className="mt-5 rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-5">
            <p className="text-sm font-black uppercase text-emerald-300">
              You joined this pool
            </p>
            <p className="mt-2 text-zinc-300">{userEntry.entryName}</p>
          </div>
        )}

        <div className="mt-5 rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
          <h2 className="text-lg font-black">Entries</h2>

          {poolEntries.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-400">
              No one has joined this pool yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {poolEntries.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/entries/${entry.id}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-700 bg-zinc-900 p-4"
                >
                  <div>
                    <p className="font-black">{entry.entryName}</p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {entry.participantName}
                    </p>
                  </div>

                  <span
                    className={
                      entry.isPaid
                        ? "text-xs font-black uppercase text-emerald-300"
                        : "text-xs font-black uppercase text-zinc-500"
                    }
                  >
                    {entry.isPaid ? "Paid" : "Unpaid"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}