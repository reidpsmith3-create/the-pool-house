import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  entryPicks,
  leaderboardResults,
  pickGroups,
  pickOptionAliases,
  pickOptions,
  pools,
} from "@/db/schema";
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

  if (pool.poolType !== "golf") {
    redirect(`/admin/pools/${pool.slug}`);
  }

  // Delete dependent records before deleting golfers.
  await db
    .delete(entryPicks)
    .where(eq(entryPicks.poolId, pool.id));

  await db
    .delete(leaderboardResults)
    .where(eq(leaderboardResults.poolId, pool.id));

  await db
    .delete(pickOptionAliases)
    .where(eq(pickOptionAliases.poolId, pool.id));

  // Delete the imported golfers.
  await db
    .delete(pickOptions)
    .where(eq(pickOptions.poolId, pool.id));

  // Delete the golfer groups last.
  await db
    .delete(pickGroups)
    .where(eq(pickGroups.poolId, pool.id));

  redirect(`/admin/pools/${pool.slug}/golf/setup?cleared=1`);
}