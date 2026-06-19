import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { pools } from "@/db/schema";
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
            className="mt-5 space-y-4"
          >
            <textarea
              name="csv"
              required
              rows={12}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-50 outline-none"
              placeholder="Paste golfer CSV here..."
            />

            <button className="w-full rounded-2xl bg-amber-300 px-4 py-4 text-sm font-black uppercase tracking-wide text-zinc-950">
              Import Golfers
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}