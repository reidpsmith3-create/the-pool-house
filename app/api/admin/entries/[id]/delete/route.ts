import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { entries, entryPicks, pools } from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/");

  const { id } = await context.params;

  const entryRows = await db
    .select({
      entry: entries,
      pool: pools,
    })
    .from(entries)
    .innerJoin(pools, eq(entries.poolId, pools.id))
    .where(eq(entries.id, id))
    .limit(1);

  const row = entryRows[0];

  if (!row) {
    redirect("/admin");
  }

  await db.delete(entryPicks).where(eq(entryPicks.entryId, row.entry.id));
  await db.delete(entries).where(eq(entries.id, row.entry.id));

  redirect(`/admin/pools/${row.pool.slug}/entries`);
}