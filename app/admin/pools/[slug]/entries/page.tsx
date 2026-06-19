import Link from "next/link";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { entries, pools } from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function AdminEntriesPage({ params }: PageProps) {
  const isAdmin = await getIsAdmin();

  if (!isAdmin) {
    redirect("/");
  }

  const { slug } = await params;

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
        <h1 className="text-3xl font-black">Entries</h1>
        <p className="mt-2 text-sm text-zinc-400">{pool.title}</p>

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

                <Link
                  href={`/entries/${entry.id}`}
                  className="mt-3 block rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-center text-sm font-black uppercase text-amber-300"
                >
                  View Picks
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}