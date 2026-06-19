import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { pools } from "@/db/schema";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PoolDetailPage({
  params,
}: PageProps) {
  const { slug } = await params;

  const poolRows = await db
    .select()
    .from(pools)
    .where(eq(pools.slug, slug))
    .limit(1);

  const pool = poolRows[0];

  if (!pool) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#0d0f12] px-5 py-8 text-zinc-50">
      <div className="mx-auto max-w-md">
        <div className="mb-6 overflow-hidden rounded-[2rem] border border-zinc-700/70 bg-black">
          <img
            src="/pool-house-logo.png"
            alt="The Pool House"
            className="w-full"
          />
        </div>

        <div className="rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
          <div className="mb-5">
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-black uppercase">
              {pool.poolType}
            </span>

            <h1 className="mt-4 text-3xl font-black">
              {pool.title}
            </h1>

            {pool.description && (
              <p className="mt-3 text-zinc-300">
                {pool.description}
              </p>
            )}
          </div>

          <div className="space-y-3 border-t border-zinc-700 pt-5">
            <div className="flex justify-between">
              <span className="text-zinc-400">Entry Fee</span>
              <span>${pool.entryFee ?? "0.00"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">
                Max Entries Per User
              </span>
              <span>{pool.maxEntriesPerUser}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Published</span>
              <span>
                {pool.isPublished ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>

        {pool.rules && (
          <div className="mt-5 rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
            <h2 className="mb-3 text-lg font-black">
              Rules
            </h2>

            <div className="whitespace-pre-wrap text-zinc-300">
              {pool.rules}
            </div>
          </div>
        )}

        <button className="mt-5 w-full rounded-2xl bg-amber-300 px-4 py-4 text-sm font-black uppercase tracking-wide text-zinc-950">
          Join Pool
        </button>
      </div>
    </main>
  );
}