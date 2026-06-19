import Link from "next/link";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { entries, pools } from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ created?: string; missing?: string }>;
};

export default async function AdminEntriesPage({
  params,
  searchParams,
}: PageProps) {
  const isAdmin = await getIsAdmin();

  if (!isAdmin) {
    redirect("/");
  }

  const { slug } = await params;
  const { created, missing } = await searchParams;

  const poolRows = await db
    .select()
    .from(pools)
    .where(eq(pools.slug, slug))
    .limit(1);

  const pool = poolRows[0];

  if (!pool) {
    redirect("/admin");
  }

  const poolEntries = await db
    .select()
    .from(entries)
    .where(eq(entries.poolId, pool.id));

  return (
    <main className="min-h-screen bg-[#0d0f12] px-5 py-8 text-zinc-50">
      <div className="mx-auto max-w-md">
        <p className="text-xs font-black uppercase text-amber-300">
          Admin · Entry Management
        </p>
        <h1 className="mt-3 text-3xl font-black">Entries</h1>
        <p className="mt-2 text-sm text-zinc-400">{pool.title}</p>

        {created === "1" && (
          <div className="mt-5 rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-200">
            Entry created.
          </div>
        )}

        {missing === "1" && (
          <div className="mt-5 rounded-3xl border border-red-500/40 bg-red-500/10 p-4 text-sm font-bold text-red-200">
            Participant name and entry name are required.
          </div>
        )}

        <div className="mt-6 rounded-3xl border border-amber-500/40 bg-amber-500/10 p-5">
          <h2 className="text-lg font-black text-amber-200">
            Add Manual Entry
          </h2>
          <p className="mt-2 text-sm text-zinc-300">
            Use this for entries from another site. Manual entries are not tied
            to your account.
          </p>

          <form
            action={`/api/admin/pools/${pool.slug}/entries/create`}
            method="post"
            className="mt-5 space-y-4"
          >
            <label className="block">
              <span className="text-sm font-bold">Participant Name</span>
              <input
                name="participantName"
                required
                placeholder="Reid Smith"
                className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold">Entry Name</span>
              <input
                name="entryName"
                required
                placeholder="Dangerous Nights Crew"
                className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900 p-4">
              <input name="isPaid" type="checkbox" />
              <span className="text-sm font-bold">Paid</span>
            </label>

            <button className="w-full rounded-2xl bg-amber-300 px-4 py-3 text-sm font-black uppercase tracking-wide text-zinc-950">
              Create Manual Entry
            </button>
          </form>
        </div>
<div className="mt-5 rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
  <h2 className="text-lg font-black">Import Entries CSV</h2>

  <p className="mt-2 text-sm text-zinc-400">
    Upload outside-site entries in this format:
  </p>

  <pre className="mt-3 overflow-x-auto rounded-2xl border border-zinc-700 bg-black/40 p-3 text-xs text-zinc-300">
{`participantName,entryName,paid
Reid Smith,Dangerous Nights Crew,yes
Neil Birky,Neil's Entry,no`}
  </pre>

  <form
    action={`/api/admin/pools/${pool.slug}/entries/import`}
    method="post"
    encType="multipart/form-data"
    className="mt-4 space-y-4"
  >
    <input
      name="file"
      type="file"
      accept=".csv,text/csv"
      required
      className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-50"
    />

    <button className="w-full rounded-2xl border border-amber-300/40 bg-amber-300/10 px-4 py-3 text-sm font-black uppercase tracking-wide text-amber-300">
      Import Entries
    </button>
  </form>
</div>
        <div className="mt-6 space-y-3">
          {poolEntries.length === 0 ? (
            <div className="rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
              No entries yet.
            </div>
          ) : (
            poolEntries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5"
              >
                <div className="mb-4 rounded-2xl border border-zinc-700 bg-zinc-900 p-4">
                  <p className="text-xs font-black uppercase text-zinc-500">
                    Participant
                  </p>
                  <p className="mt-1 font-black">{entry.participantName}</p>
                  {!entry.userId && (
                    <p className="mt-1 text-xs font-bold uppercase text-amber-300">
                      Manual Entry
                    </p>
                  )}
                </div>

                <form
                  action={`/api/admin/entries/${entry.id}/update`}
                  method="post"
                  className="space-y-4"
                >
                  <label className="block">
                    <span className="text-sm font-bold">Entry Name</span>
                    <input
                      name="entryName"
                      defaultValue={entry.entryName}
                      className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
                    />
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900 p-4">
                    <input
                      name="isPaid"
                      type="checkbox"
                      defaultChecked={entry.isPaid}
                    />
                    <span className="text-sm font-bold">Paid</span>
                  </label>

                  <input type="hidden" name="poolSlug" value={pool.slug} />

                  <button className="w-full rounded-2xl bg-amber-300 px-4 py-3 text-sm font-black uppercase tracking-wide text-zinc-950">
                    Save Entry
                  </button>
                </form>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Link
                    href={`/entries/${entry.id}`}
                    className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-center text-xs font-black uppercase text-amber-300"
                  >
                    View / Edit Picks
                  </Link>

                  <Link
                    href={`/pools/${pool.slug}/leaderboard`}
                    className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-center text-xs font-black uppercase text-zinc-200"
                  >
                    Leaderboard
                  </Link>
                </div>
                <form
  action={`/api/admin/entries/${entry.id}/delete`}
  method="post"
  className="mt-3"
>
  <button className="w-full rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs font-black uppercase text-red-300">
    Delete Entry
  </button>
</form>
              </div>
            ))
          )}
        </div>

        <Link
          href={`/admin/pools/${pool.slug}`}
          className="mt-5 block rounded-2xl bg-zinc-100 px-4 py-4 text-center text-sm font-black uppercase tracking-wide text-zinc-950"
        >
          Back to Pool Admin
        </Link>
      </div>
    </main>
  );
}