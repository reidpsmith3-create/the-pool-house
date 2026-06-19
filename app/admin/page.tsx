import Link from "next/link";
import { redirect } from "next/navigation";

import { getIsAdmin } from "@/lib/auth-helpers";

export default async function AdminPage() {
  const isAdmin = await getIsAdmin();

  if (!isAdmin) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-[#0d0f12] px-5 py-8 text-zinc-50">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-black">Admin</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Manage pools, entries, payments, scoring, and announcements.
        </p>

        <div className="mt-8 space-y-3">
          <Link
            href="/admin/pools/new"
            className="block rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5"
          >
            <p className="text-xl font-black">Create Pool</p>
            <p className="mt-1 text-sm text-zinc-400">
              Build and publish a new pool.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}