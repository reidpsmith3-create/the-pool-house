import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { leaderboardSources, pools } from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/");

  const { slug } = await context.params;
  const formData = await request.formData();

  const autoSyncEnabled = formData.get("autoSyncEnabled") === "on";

  const poolRows = await db
    .select()
    .from(pools)
    .where(eq(pools.slug, slug))
    .limit(1);

  const pool = poolRows[0];
  if (!pool) redirect("/admin");

  await db
    .update(leaderboardSources)
    .set({
      isActive: autoSyncEnabled,
    })
    .where(eq(leaderboardSources.poolId, pool.id));

  redirect(`/admin/pools/${pool.slug}/golf/scores?sourceSaved=1`);
}