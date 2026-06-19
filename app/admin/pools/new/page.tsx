"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function NewPoolPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/admin/pools", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Something went wrong.");
      setIsSaving(false);
      return;
    }

    router.push(`/admin/pools/${data.slug}`);
  }

  return (
    <main className="min-h-screen bg-[#0d0f12] px-5 py-8 text-zinc-50">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-black">Create Pool</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Add a new pool to The Pool House.
        </p>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-bold">Title</span>
            <input
              name="title"
              required
              placeholder="Travelers Championship Pool"
              className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
            />
          </label>

<div className="grid grid-cols-2 gap-4">
  <label className="block">
    <span className="text-sm font-bold">Pool Type</span>
    <select
      name="poolType"
      required
      className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
      defaultValue="golf"
    >
      <option value="golf">Golf Pool</option>
      <option value="survivor">NFL Survivor</option>
      <option value="pickem">Pick&apos;em</option>
      <option value="bracket">Bracket Pool</option>
      <option value="predictions">Predictions Pool</option>
    </select>
  </label>

  <label className="block">
    <span className="text-sm font-bold">Status</span>
    <select
      name="status"
      required
      className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
      defaultValue="draft"
    >
      <option value="draft">Draft</option>
      <option value="upcoming">Upcoming</option>
      <option value="open">Open</option>
      <option value="live">Live</option>
      <option value="completed">Completed</option>
      <option value="archived">Archived</option>
    </select>
  </label>
</div>

          <label className="block">
            <span className="text-sm font-bold">Description</span>
            <textarea
              name="description"
              rows={3}
              placeholder="Short public description."
              className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">Rules</span>
            <textarea
              name="rules"
              rows={5}
              placeholder="Pool rules, scoring notes, payout details, etc."
              className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-bold">Entry Fee</span>
              <input
                name="entryFee"
                type="number"
                min="0"
                step="0.01"
                placeholder="10"
                className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold">Max Entries</span>
              <input
                name="maxEntriesPerUser"
                type="number"
                min="1"
                defaultValue="1"
                className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
              />
            </label>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900 p-4">
            <input name="isPublished" type="checkbox" />
            <span className="text-sm font-bold">Publish immediately</span>
          </label>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-2xl bg-amber-300 px-4 py-4 text-sm font-black uppercase tracking-wide text-zinc-950 disabled:opacity-60"
          >
            {isSaving ? "Creating..." : "Create Pool"}
          </button>
        </form>
      </div>
    </main>
  );
}