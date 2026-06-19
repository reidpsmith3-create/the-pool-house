import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { entries, entryPicks, pickGroups, pickOptions, pools } from "@/db/schema";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    saved?: string;
  }>;
};

export default async function EntryPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { saved } = await searchParams;

  const entryRows = await db
    .select({
      entry: entries,
      pool: pools,
    })
    .from(entries)
    .innerJoin(pools, eq(entries.poolId, pools.id))
    .where(eq(entries.id, id))
    .limit(1);

  const row = entryRows[0];

  if (!row) {
    notFound();
  }

  const groups = await db
    .select()
    .from(pickGroups)
    .where(eq(pickGroups.poolId, row.pool.id))
    .orderBy(pickGroups.sortOrder);

  const options = await db
    .select()
    .from(pickOptions)
    .where(eq(pickOptions.poolId, row.pool.id));

  const savedPicks = await db
    .select()
    .from(entryPicks)
    .where(eq(entryPicks.entryId, row.entry.id));

  const savedPickIds = new Set(savedPicks.map((pick) => pick.pickOptionId));
  const selectedOptions = options.filter((option) => savedPickIds.has(option.id));

  return (
    <main className="min-h-screen bg-[#0d0f12] px-5 py-8 text-zinc-50">
      <div className="mx-auto max-w-md">
        <div className="mb-6 overflow-hidden rounded-[2rem] border border-zinc-700/70 bg-black">
          <img src="/pool-house-logo.png" alt="The Pool House" className="w-full" />
        </div>

        {saved === "1" && (
          <div className="mb-5 rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-200">
            Picks saved.
          </div>
        )}

        <div className="rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
          <p className="text-xs font-black uppercase text-amber-300">Entry</p>
          <h1 className="mt-3 text-3xl font-black">{row.entry.entryName}</h1>
          <p className="mt-2 text-zinc-400">{row.pool.title}</p>

          <div className="mt-5 space-y-3 border-t border-zinc-700 pt-5">
            <div className="flex justify-between">
              <span className="text-zinc-400">Participant</span>
              <span>{row.entry.participantName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Paid</span>
              <span>{row.entry.isPaid ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Score</span>
              <span>{row.entry.currentScore ?? "—"}</span>
            </div>
          </div>
        </div>

        {selectedOptions.length > 0 && (
          <div className="mt-5 rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
            <h2 className="text-lg font-black">Your Picks</h2>
            <div className="mt-4 space-y-3">
              {groups.map((group) => {
                const selected = selectedOptions.find(
                  (option) => option.groupId === group.id
                );

                if (!selected) return null;

                return (
                  <div
                    key={group.id}
                    className="flex justify-between gap-4 border-b border-zinc-700 pb-3 last:border-0 last:pb-0"
                  >
                    <span className="text-zinc-400">{group.name}</span>
                    <span className="text-right font-bold">
                      {selected.displayName ?? selected.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <form
          action={`/api/entries/${row.entry.id}/picks`}
          method="post"
          className="mt-5 space-y-5"
        >
          {groups.length === 0 ? (
            <div className="rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
              <h2 className="text-lg font-black">No Pick Groups Yet</h2>
              <p className="mt-2 text-sm text-zinc-400">
                This pool does not have pick groups imported yet.
              </p>
            </div>
          ) : (
            groups.map((group) => {
              const groupOptions = options.filter(
                (option) => option.groupId === group.id
              );

              return (
                <section
                  key={group.id}
                  className="rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5"
                >
                  <h2 className="text-lg font-black">{group.name}</h2>
                  <p className="mt-1 text-xs text-zinc-400">Pick {group.maxPicks}</p>

                  <div className="mt-4 space-y-3">
                    {groupOptions.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900 p-4"
                      >
                        <input
                          type="radio"
                          name={`group-${group.id}`}
                          value={option.id}
                          defaultChecked={savedPickIds.has(option.id)}
                        />
                        <span className="font-bold">
                          {option.displayName ?? option.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </section>
              );
            })
          )}

          {groups.length > 0 && (
            <button className="w-full rounded-2xl bg-amber-300 px-4 py-4 text-sm font-black uppercase tracking-wide text-zinc-950">
              Save Picks
            </button>
          )}
        </form>
      </div>
    </main>
  );
}