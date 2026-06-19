import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { pickGroups, pickOptions, pools } from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function POST(
  _request: Request,
  context: RouteContext
) {
  const isAdmin = await getIsAdmin();

  if (!isAdmin) {
    redirect("/");
  }

  const { slug } = await context.params;

  const poolRows = await db
    .select()
    .from(pools)
    .where(eq(pools.slug, slug))
    .limit(1);

  const pool = poolRows[0];

  if (!pool) {
    redirect("/admin");
  }

  await db
    .delete(pickOptions)
    .where(eq(pickOptions.poolId, pool.id));

  await db
    .delete(pickGroups)
    .where(eq(pickGroups.poolId, pool.id));

  redirect(`/admin/pools/${pool.slug}/golf/setup`);
}