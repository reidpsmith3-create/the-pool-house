import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  entries,
  entryPicks,
  leaderboardResults,
  leaderboardSources,
  payoutRules,
  pickGroups,
  pickOptionAliases,
  pickOptions,
  poolAnnouncements,
  poolPeriods,
  pools,
} from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/");

  const { slug } = await context.params;

  const poolRows = await db
    .select()
    .from(pools)
    .where(eq(pools.slug, slug))
    .limit(1);

  const pool = poolRows[0];
  if (!pool) redirect("/admin");

  await db.delete(entryPicks).where(eq(entryPicks.poolId, pool.id));
  await db.delete(entries).where(eq(entries.poolId, pool.id));
  await db.delete(leaderboardResults).where(eq(leaderboardResults.poolId, pool.id));
  await db.delete(leaderboardSources).where(eq(leaderboardSources.poolId, pool.id));
  await db.delete(pickOptionAliases).where(eq(pickOptionAliases.poolId, pool.id));
  await db.delete(pickOptions).where(eq(pickOptions.poolId, pool.id));
  await db.delete(pickGroups).where(eq(pickGroups.poolId, pool.id));
  await db.delete(poolPeriods).where(eq(poolPeriods.poolId, pool.id));
  await db.delete(poolAnnouncements).where(eq(poolAnnouncements.poolId, pool.id));
  await db.delete(payoutRules).where(eq(payoutRules.poolId, pool.id));

  await db.delete(pools).where(eq(pools.id, pool.id));

  redirect("/admin");
}