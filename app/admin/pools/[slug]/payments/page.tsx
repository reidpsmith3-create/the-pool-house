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

export default async function PaymentsPage({ params }: PageProps) {
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
        <h1 className="text-3xl font-black">Payments</h1>

        <p className="mt-2 text-sm text-zinc-400">
          {pool.title}
        </p>

        <div className="mt-6 space-y-3">
          {poolEntries.map((entry) => (
            <form
              key={entry.id}
              action={`/api/admin/pools/${pool.slug}/payments`}
              method="post"
              className="rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5"
            >
              <input
                type="hidden"
                name="entryId"
                value={entry.id}
              />

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-black">
                    {entry.entryName}
                  </p>

                  <p className="text-sm text-zinc-400">
                    {entry.participantName}
                  </p>
                </div>

                <button
                  name="isPaid"
                  value={entry.isPaid ? "false" : "true"}
                  className={
                    entry.isPaid
                      ? "rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black uppercase text-black"
                      : "rounded-xl bg-zinc-700 px-4 py-2 text-xs font-black uppercase"
                  }
                >
                  {entry.isPaid ? "Paid" : "Unpaid"}
                </button>
              </div>
            </form>
          ))}
        </div>
      </div>
    </main>
  );
}