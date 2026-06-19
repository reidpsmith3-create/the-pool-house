import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { entries, pools } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth-helpers";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/api/auth/signin");
  }

  const { slug } = await context.params;

  const poolRows = await db
    .select()
    .from(pools)
    .where(eq(pools.slug, slug))
    .limit(1);

  const pool = poolRows[0];

  if (!pool || !pool.isPublished || pool.status !== "open") {
    redirect("/pools");
  }

  const existingEntries = await db
    .select()
    .from(entries)
    .where(eq(entries.poolId, pool.id));

  const userEntries = existingEntries.filter(
    (entry) => entry.userId === currentUser.id
  );

  if (userEntries.length >= pool.maxEntriesPerUser) {
    redirect(`/pools/${pool.slug}`);
  }

  const entryName =
    userEntries.length === 0
      ? `${currentUser.name ?? "My"} Entry`
      : `${currentUser.name ?? "My"} Entry ${userEntries.length + 1}`;

  const insertedEntries = await db
    .insert(entries)
    .values({
      poolId: pool.id,
      userId: currentUser.id,
      participantName: currentUser.name ?? currentUser.email,
      entryName,
    })
    .returning();

  const entry = insertedEntries[0];

  redirect(`/entries/${entry.id}`);
}