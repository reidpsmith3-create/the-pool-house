import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { bracketTeams, pools } from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/");

  const { slug } = await context.params;
  const formData = await request.formData();

  const name = String(formData.get("name") ?? "").trim();
  const seedValue = Number(formData.get("seed") ?? 0);

  if (!name || !Number.isInteger(seedValue) || seedValue < 1) {
    redirect(`/admin/pools/${slug}/bracket/setup`);
  }

  const poolRows = await db
    .select()
    .from(pools)
    .where(eq(pools.slug, slug))
    .limit(1);

  const pool = poolRows[0];
  if (!pool) redirect("/admin");

  if (pool.poolType !== "bracket") {
    redirect(`/admin/pools/${pool.slug}`);
  }

  await db.insert(bracketTeams).values({
    poolId: pool.id,
    name,
    seed: seedValue,
  });

  redirect(`/admin/pools/${pool.slug}/bracket/setup?added=1`);
}