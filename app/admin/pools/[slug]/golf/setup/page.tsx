import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { pickGroups, pools } from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";


type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function GolfSetupPage({ params }: PageProps) {
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
const groups = await db
  .select()
  .from(pickGroups)
  .where(eq(pickGroups.poolId, pool.id))
  .orderBy(pickGroups.sortOrder);
  return (
    <main className="min-h-screen bg-[#0d0f12] px-5 py-8 text-zinc-50">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-black">Golf Setup</h1>
        <p className="mt-2 text-sm text-zinc-400">{pool.title}</p>

        <div className="mt-6 rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
          <h2 className="text-lg font-black">Import Golfers</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Paste a CSV with these columns:
          </p>

          <pre className="mt-3 overflow-x-auto rounded-2xl bg-black/30 p-3 text-xs text-zinc-300">
{`group_name,golfer_name,display_name,source_id,source_name
Group A,Scottie Scheffler,Scottie Scheffler,460984,espn
Group B,Rory McIlroy,Rory McIlroy,3470,espn`}
          </pre>

          <form
  action={`/api/admin/pools/${pool.slug}/golf/import`}
  method="post"
  encType="multipart/form-data"
  className="mt-5 space-y-4"
>
<input
  name="csvFile"
  type="file"
  accept=".csv,text/csv"
  required
  className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-50 outline-none"
/>

            <button className="w-full rounded-2xl bg-amber-300 px-4 py-4 text-sm font-black uppercase tracking-wide text-zinc-950">
              Import Golfers
            </button>
          </form>
          <form
  action={`/api/admin/pools/${pool.slug}/golf/clear`}
  method="post"
  className="mt-5"
>
  <button
    type="submit"
    className="w-full rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-4 text-sm font-black uppercase tracking-wide text-red-300"
  >
    Clear Imported Golfers
  </button>
</form>
        </div>
      </div>
      {groups.length > 0 && (
  <div className="mt-6 rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
    <h2 className="text-lg font-black">Pick Rules by Tier</h2>
    <p className="mt-2 text-sm text-zinc-400">
      Set how many golfers each entry must pick from each tier.
    </p>

    <form
      action={`/api/admin/pools/${pool.slug}/golf/groups/update`}
      method="post"
      className="mt-5 space-y-4"
    >
      {groups.map((group) => (
        <div
          key={group.id}
          className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4"
        >
          <p className="font-black">{group.name}</p>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-bold uppercase text-zinc-400">
                Min Picks
              </span>
              <input
                name={`minPicks-${group.id}`}
                type="number"
                min="0"
                defaultValue={group.minPicks}
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-black/40 px-3 py-2 text-zinc-50 outline-none"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase text-zinc-400">
                Max Picks
              </span>
              <input
                name={`maxPicks-${group.id}`}
                type="number"
                min="0"
                defaultValue={group.maxPicks}
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-black/40 px-3 py-2 text-zinc-50 outline-none"
              />
            </label>
          </div>
        </div>
      ))}

      <button className="w-full rounded-2xl bg-amber-300 px-4 py-4 text-sm font-black uppercase tracking-wide text-zinc-950">
        Save Pick Rules
      </button>
    </form>
  </div>
)}
    </main>
  );
}