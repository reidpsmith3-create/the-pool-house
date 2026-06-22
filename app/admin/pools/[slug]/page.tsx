import Link from "next/link";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  entries,
  leaderboardResults,
  pickGroups,
  pickOptions,
  pools,
} from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ unsupportedFinalize?: string }>;
};

function StatusCard({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  tone: "good" | "warn" | "neutral";
}) {
  const toneClass =
    tone === "good"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
      : tone === "warn"
        ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
        : "border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] text-zinc-300";

  return (
    <div className={`rounded-3xl border p-4 ${toneClass}`}>
      <p className="text-xs font-black uppercase">{label}</p>
      <p className="mt-2 text-2xl font-black text-zinc-50">{value}</p>
      <p className="mt-1 text-xs text-zinc-400">{helper}</p>
    </div>
  );
}

export default async function AdminPoolDashboardPage({
  params,
  searchParams,
}: PageProps) {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/");

  const { slug } = await params;
  const { unsupportedFinalize } = await searchParams;

  const poolRows = await db
    .select()
    .from(pools)
    .where(eq(pools.slug, slug))
    .limit(1);

  const pool = poolRows[0];
  if (!pool) redirect("/admin");

  const isGolfPool = pool.poolType === "golf";

  const poolEntries = await db
    .select()
    .from(entries)
    .where(eq(entries.poolId, pool.id));

  const groups = await db
    .select()
    .from(pickGroups)
    .where(eq(pickGroups.poolId, pool.id));

  const golfers = await db
    .select()
    .from(pickOptions)
    .where(eq(pickOptions.poolId, pool.id));

  const scores = await db
    .select()
    .from(leaderboardResults)
    .where(eq(leaderboardResults.poolId, pool.id));

  const paidCount = poolEntries.filter((entry) => entry.isPaid).length;
  const prizePool = Number(pool.entryFee ?? 0) * poolEntries.length;
  const unpaidCount = poolEntries.length - paidCount;

  const poolTypeActions: Record<string, string[][]> = {
  golf: [
    ["Golf Setup", `/admin/pools/${pool.slug}/golf/setup`],
    ["Golf Scores", `/admin/pools/${pool.slug}/golf/scores`],
  ],
  survivor: [["Survivor Setup", `/admin/pools/${pool.slug}/survivor/setup`]],
  pickem: [["Pick'em Setup", `/admin/pools/${pool.slug}/pickem/setup`]],
  bracket: [["Bracket Setup", `/admin/pools/${pool.slug}/bracket/setup`]],
  predictions: [
    ["Predictions Setup", `/admin/pools/${pool.slug}/predictions/setup`],
  ],
};

const actions = [
  ["Edit Pool", `/admin/pools/${pool.slug}/edit`],
  ["Entries", `/admin/pools/${pool.slug}/entries`],
  ["Payments", `/admin/pools/${pool.slug}/payments`],
  ...(poolTypeActions[pool.poolType] ?? []),
  ["Public Page", `/pools/${pool.slug}`],
  ["Leaderboard", `/pools/${pool.slug}/leaderboard`],
];

  return (
    <main className="min-h-screen bg-[#0d0f12] px-5 py-8 text-zinc-50">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-black">Pool Admin</h1>
        <p className="mt-2 text-sm text-zinc-400">{pool.title}</p>

        {unsupportedFinalize === "1" && (
          <div className="mt-5 rounded-3xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
            <p className="font-black">Finalize is not available yet.</p>
            <p className="mt-1 text-zinc-300">
              Golf pools can be finalized now. This pool type needs its own
              scoring/finalization rules first.
            </p>
          </div>
        )}

        <div className="mt-6 rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
          <p className="text-xs font-black uppercase text-amber-300">
            {pool.status}
          </p>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-black">{poolEntries.length}</p>
              <p className="text-xs text-zinc-500">Entries</p>
            </div>

            <div>
              <p className="text-2xl font-black">{paidCount}</p>
              <p className="text-xs text-zinc-500">Paid</p>
            </div>

            <div>
              <p className="text-2xl font-black">${prizePool.toFixed(0)}</p>
              <p className="text-xs text-zinc-500">Prize</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="mb-3 text-lg font-black">Checklist</h2>

          <div className="grid grid-cols-2 gap-3">
            <StatusCard
              label="Entries"
              value={String(poolEntries.length)}
              helper={poolEntries.length > 0 ? "People have joined" : "No entries yet"}
              tone={poolEntries.length > 0 ? "good" : "warn"}
            />

            <StatusCard
              label="Payments"
              value={`${paidCount}/${poolEntries.length}`}
              helper={unpaidCount === 0 ? "All entries paid" : `${unpaidCount} unpaid`}
              tone={poolEntries.length > 0 && unpaidCount === 0 ? "good" : "warn"}
            />

            {isGolfPool && (
              <>
                <StatusCard
                  label="Golfers"
                  value={String(golfers.length)}
                  helper={
                    groups.length > 0
                      ? `${groups.length} groups imported`
                      : "No groups imported"
                  }
                  tone={golfers.length > 0 && groups.length > 0 ? "good" : "warn"}
                />

                <StatusCard
                  label="Places"
                  value={String(scores.length)}
                  helper={scores.length > 0 ? "Places entered" : "No places entered"}
                  tone={scores.length > 0 ? "good" : "warn"}
                />
              </>
            )}

            <StatusCard
              label="Champion"
              value={pool.winnerName ? "Set" : "None"}
              helper={pool.winnerName ? pool.winnerName : "Pool not finalized"}
              tone={pool.winnerName ? "good" : "neutral"}
            />

            <StatusCard
              label="Deadline"
              value={pool.entryDeadlineAt ? "Set" : "None"}
              helper={
                pool.entryDeadlineAt
                  ? new Date(pool.entryDeadlineAt).toLocaleString()
                  : "Picks stay open"
              }
              tone={pool.entryDeadlineAt ? "good" : "warn"}
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {actions.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5 text-center text-sm font-black uppercase tracking-wide"
            >
              <div>{label}</div>
{pool.poolType !== "golf" &&
  pool.poolType !== "predictions" &&
  label.includes("Setup") && (
    <div className="mt-2 text-[10px] font-bold text-zinc-500">
      Coming Soon
    </div>
  )}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}