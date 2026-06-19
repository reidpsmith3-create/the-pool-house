import Link from "next/link";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { pools } from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PredictionsSetupPage({
  params,
}: PageProps) {
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

  return (
    <main className="min-h-screen bg-[#0d0f12] px-5 py-8 text-zinc-50">
      <div className="mx-auto max-w-md">
        <p className="text-xs font-black uppercase text-amber-300">
          Admin · Predictions Setup
        </p>

        <h1 className="mt-3 text-3xl font-black">
          Predictions Setup
        </h1>

        <p className="mt-2 text-sm text-zinc-400">
          {pool.title}
        </p>

        <div className="mt-6 rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
          <p className="font-black">Coming soon.</p>

          <p className="mt-2 text-sm text-zinc-400">
            This page will eventually manage custom prediction questions,
            answer choices, locking, grading, and scoring.
          </p>
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