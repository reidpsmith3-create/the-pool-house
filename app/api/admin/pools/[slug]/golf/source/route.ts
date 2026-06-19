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

  const orgId = String(formData.get("orgId") ?? "").trim();
  const tournId = String(formData.get("tournId") ?? "").trim();
  const year = String(formData.get("year") ?? "").trim();

  if (!orgId || !tournId || !year) {
    redirect(`/admin/pools/${slug}/golf/scores?sourceMissing=1`);
  }

  const poolRows = await db
    .select()
    .from(pools)
    .where(eq(pools.slug, slug))
    .limit(1);

  const pool = poolRows[0];
  if (!pool) redirect("/admin");

  const sourceUrl = `https://live-golf-data.p.rapidapi.com/leaderboard?orgId=${encodeURIComponent(
    orgId
  )}&tournId=${encodeURIComponent(tournId)}&year=${encodeURIComponent(year)}`;

  await db
    .update(leaderboardSources)
    .set({ isActive: false })
    .where(eq(leaderboardSources.poolId, pool.id));

  await db.insert(leaderboardSources).values({
    poolId: pool.id,
    sourceType: "rapidapi-golf",
    sourceUrl,
    isActive: true,
  });

  redirect(`/admin/pools/${pool.slug}/golf/scores?sourceSaved=1`);
}