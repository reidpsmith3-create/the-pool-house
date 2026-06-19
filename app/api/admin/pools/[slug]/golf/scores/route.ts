import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { leaderboardResults, pickOptions, pools } from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
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

  const golfers = await db
    .select()
    .from(pickOptions)
    .where(eq(pickOptions.poolId, pool.id));

  const formData = await request.formData();

  await db.delete(leaderboardResults).where(eq(leaderboardResults.poolId, pool.id));

  const values: (typeof leaderboardResults.$inferInsert)[] = [];

  for (const golfer of golfers) {
    const positionValue = String(
      formData.get(`position-${golfer.id}`) ?? ""
    ).trim();

    const position = Number(positionValue);

    if (!Number.isFinite(position) || position <= 0) {
      continue;
    }

    values.push({
      poolId: pool.id,
      pickOptionId: golfer.id,
      sourceId: golfer.sourceId,
      name: golfer.displayName ?? golfer.name,
      position,
      displayPosition: String(position),
      status: "active",
      scoreValue: String(position),
      metadata: {
        scoringModel: "position",
      },
    });
  }

  if (values.length > 0) {
    await db.insert(leaderboardResults).values(values);
  }

  redirect(`/pools/${pool.slug}/leaderboard`);
}