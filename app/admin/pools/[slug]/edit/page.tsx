import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { pools } from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EditPoolPage({ params }: PageProps) {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/");

  const { slug } = await params;

  const poolRows = await db
    .select()
    .from(pools)
    .where(eq(pools.slug, slug))
    .limit(1);

  const pool = poolRows[0];
  if (!pool) redirect("/admin");
  const scoringSettings =
  pool.scoringSettings && typeof pool.scoringSettings === "object"
    ? (pool.scoringSettings as {
       winnerBonus?: number;
topFiveBonus?: number;
scoresToCount?: number;
missedCutScore?: number;
      })
    : {};

const winnerBonus = Number(scoringSettings.winnerBonus ?? 0);
const topFiveBonus = Number(scoringSettings.topFiveBonus ?? 0);
const scoresToCount = Number(scoringSettings.scoresToCount ?? 4);
const missedCutScore =
  scoringSettings.missedCutScore ?? "";

  return (
    <main className="min-h-screen bg-[#0d0f12] px-5 py-8 text-zinc-50">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-black">Edit Pool</h1>
        <p className="mt-2 text-sm text-zinc-400">{pool.title}</p>

        <form
          action={`/api/admin/pools/${pool.slug}/edit`}
          method="post"
          className="mt-8 space-y-5"
        >
          <label className="block">
            <span className="text-sm font-bold">Title</span>
            <input
              name="title"
              defaultValue={pool.title}
              required
              className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
            />
          </label>
          <label className="block">
  <span className="text-sm font-bold">Pool Logo URL</span>
  <input
    name="logoUrl"
    type="url"
    defaultValue={pool.logoUrl ?? ""}
    placeholder="https://example.com/logo.png"
    className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
  />
</label>

          <label className="block">
            <span className="text-sm font-bold">Status</span>
            <select
              name="status"
              defaultValue={pool.status}
              className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
            >
              <option value="draft">Draft</option>
              <option value="upcoming">Upcoming</option>
              <option value="open">Open</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </label>
<label className="block">
  <span className="text-sm font-bold">Entry Deadline</span>
  <input
    name="entryDeadlineAt"
    type="datetime-local"
    defaultValue={
      pool.entryDeadlineAt
        ? new Date(pool.entryDeadlineAt).toISOString().slice(0, 16)
        : ""
    }
    className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
  />
</label>
{pool.poolType === "golf" && (
  <div className="rounded-3xl border border-amber-500/40 bg-amber-500/10 p-5">
    <h2 className="text-lg font-black text-amber-200">Golf Bonuses</h2>
    <p className="mt-2 text-sm text-zinc-300">
      Bonuses subtract from an entry&apos;s total position score. Winner bonus
      and top-five bonus do not stack.
    </p>

    <div className="mt-4 grid grid-cols-2 gap-4">
      <label className="block">
        <span className="text-sm font-bold">Winner Bonus</span>
        <input
          name="winnerBonus"
          type="number"
          min="0"
          step="1"
          defaultValue={winnerBonus}
          className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
        />
      </label>

      <label className="block">
        <span className="text-sm font-bold">Top Five Bonus</span>
        <input
          name="topFiveBonus"
          type="number"
          min="0"
          step="1"
          defaultValue={topFiveBonus}
          className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
        />
      </label>
      <label className="block">
  <span className="text-sm font-bold">Scores to Count</span>
  <input
    name="scoresToCount"
    type="number"
    min="1"
    step="1"
    defaultValue={scoresToCount}
    className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
  />
</label>
<label className="block">
  <span className="text-sm font-bold">Missed Cut Score</span>

  <input
    name="missedCutScore"
    type="number"
    min="1"
    step="1"
    defaultValue={missedCutScore}
    placeholder="Optional"
    className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
  />
</label>
    </div>

    <p className="mt-3 text-xs text-zinc-400">
      Example: if a picked golfer finishes 1st, only the winner bonus applies.
      If they finish 2nd–5th, only the top-five bonus applies.
    </p>
  </div>
)}
          <label className="block">
            <span className="text-sm font-bold">Description</span>
            <textarea
              name="description"
              rows={3}
              defaultValue={pool.description ?? ""}
              className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">Rules</span>
            <textarea
              name="rules"
              rows={5}
              defaultValue={pool.rules ?? ""}
              className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
            />
          </label>

          <button className="w-full rounded-2xl bg-amber-300 px-4 py-4 text-sm font-black uppercase tracking-wide text-zinc-950">
            Save Pool
          </button>
        </form>
        <form
  action={`/api/admin/pools/${pool.slug}/finalize`}
  method="post"
  className="mt-5"
>
  <button className="w-full rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-4 text-sm font-black uppercase tracking-wide text-emerald-300">
    Finalize Pool
  </button>
</form>
<form
  action={`/api/admin/pools/${pool.slug}/delete`}
  method="post"
  className="mt-5"
>
  <button className="w-full rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-4 text-sm font-black uppercase tracking-wide text-red-300">
    Delete Pool
  </button>
</form>
      </div>
    </main>
  );
}