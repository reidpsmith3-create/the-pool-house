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
      </div>
    </main>
  );
}