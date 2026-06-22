import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  bracketGames,
  bracketPicks,
  bracketScoringRules,
  bracketTeams,
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

  await db.delete(bracketPicks).where(eq(bracketPicks.poolId, pool.id));
  await db.delete(bracketGames).where(eq(bracketGames.poolId, pool.id));
  await db
    .delete(bracketScoringRules)
    .where(eq(bracketScoringRules.poolId, pool.id));
  await db.delete(bracketTeams).where(eq(bracketTeams.poolId, pool.id));

  redirect(`/admin/pools/${pool.slug}/bracket/setup?cleared=1`);
}