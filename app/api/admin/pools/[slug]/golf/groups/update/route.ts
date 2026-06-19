import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { pickGroups, pools } from "@/db/schema";
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

  const groups = await db
    .select()
    .from(pickGroups)
    .where(eq(pickGroups.poolId, pool.id));

  for (const group of groups) {
    const minPicks = Number(formData.get(`minPicks-${group.id}`) ?? 0);
    const maxPicks = Number(formData.get(`maxPicks-${group.id}`) ?? 1);

    await db
      .update(pickGroups)
      .set({
        minPicks: Number.isFinite(minPicks) ? minPicks : 0,
        maxPicks: Number.isFinite(maxPicks) ? maxPicks : 1,
      })
      .where(eq(pickGroups.id, group.id));
  }

  redirect(`/admin/pools/${pool.slug}/golf/setup?groupsSaved=1`);
}