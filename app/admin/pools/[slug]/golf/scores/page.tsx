import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { leaderboardResults, pickOptions, pools } from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function GolfScoresPage({ params }: PageProps) {
  const isAdmin = await getIsAdmin();

  if (!isAdmin) redirect("/");

  const { slug } = await params;

  const poolRows = await db.select().from(pools).where(eq(pools.slug, slug)).limit(1);
  const pool = poolRows[0];

  if (!pool) redirect("/admin");

  const golfers = await db
    .select()
    .from(pickOptions)
    .where(eq(pickOptions.poolId, pool.id));

  const results = await db
    .select()
    .from(leaderboardResults)
    .where(eq(leaderboardResults.poolId, pool.id));

  const resultByPickOptionId = new Map(
    results.map((result) => [result.pickOptionId, result])
  );

  return (
    <main className="min-h-screen bg-[#0d0f12] px-5 py-8 text-zinc-50">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-black">Golf Scores</h1>
        <p className="mt-2 text-sm text-zinc-400">{pool.title}</p>

        <form
          action={`/api/admin/pools/${pool.slug}/golf/scores`}
          method="post"
          className="mt-6 space-y-4"
        >
          {golfers.map((golfer) => {
            const result = resultByPickOptionId.get(golfer.id);

            return (
              <div
                key={golfer.id}
                className="rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-4"
              >
                <p className="font-black">{golfer.displayName ?? golfer.name}</p>

                <input type="hidden" name="pickOptionId" value={golfer.id} />

                <label className="mt-3 block">
                  <span className="text-sm text-zinc-400">Current Place</span>
                  <input
                    name={`position-${golfer.id}`}
                    type="number"
                    min="1"
                    defaultValue={result?.position ?? ""}
                    placeholder="1"
                    className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
                  />
                </label>
              </div>
            );
          })}

          <button className="w-full rounded-2xl bg-amber-300 px-4 py-4 text-sm font-black uppercase tracking-wide text-zinc-950">
            Save Places
          </button>
        </form>
      </div>
    </main>
  );
}