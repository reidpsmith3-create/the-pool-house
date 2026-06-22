import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { bracketScoringRules, pools } from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/");

  const { slug } = await context.params;
  const formData = await request.formData();

  const poolRows = await db
    .select()
    .from(pools)
    .where(eq(pools.slug, slug))
    .limit(1);

  const pool = poolRows[0];
  if (!pool) redirect("/admin");

  const rules = await db
    .select()
    .from(bracketScoringRules)
    .where(eq(bracketScoringRules.poolId, pool.id));

  for (const rule of rules) {
    const pointsValue = Number(formData.get(`points-${rule.id}`) ?? rule.points);

    if (!Number.isInteger(pointsValue) || pointsValue < 0) continue;

    await db
      .update(bracketScoringRules)
      .set({ points: pointsValue })
      .where(eq(bracketScoringRules.id, rule.id));
  }

  redirect(`/admin/pools/${pool.slug}/bracket/setup?scoringUpdated=1`);
}