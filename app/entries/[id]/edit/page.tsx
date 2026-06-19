import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import { db } from "@/db";
import { entries } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth-helpers";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditEntryPage({
  params,
}: PageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/api/auth/signin");
  }

  const { id } = await params;

  const entryRows = await db
    .select()
    .from(entries)
    .where(eq(entries.id, id))
    .limit(1);

  const entry = entryRows[0];

  if (!entry) {
    notFound();
  }

  if (entry.userId !== currentUser.id) {
    redirect("/me");
  }

  return (
    <main className="min-h-screen bg-[#0d0f12] px-5 py-8 text-zinc-50">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-black">
          Edit Entry
        </h1>

        <form
          action={`/api/entries/${entry.id}/edit`}
          method="post"
          className="mt-6 space-y-5"
        >
          <label className="block">
            <span className="text-sm font-bold">
              Entry Name
            </span>

            <input
              name="entryName"
              defaultValue={entry.entryName}
              required
              className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3"
            />
          </label>

          <button className="w-full rounded-2xl bg-amber-300 px-4 py-4 text-sm font-black uppercase tracking-wide text-zinc-950">
            Save Entry
          </button>
        </form>
      </div>
    </main>
  );
}