import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { pickOptionAliases, pickOptions, pools } from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";
import { normalizeGolfName } from "@/lib/golf/parse-leaderboard";

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

  const golfers = await db
    .select()
    .from(pickOptions)
    .where(eq(pickOptions.poolId, pool.id));

  const validGolferIds = new Set(golfers.map((golfer) => golfer.id));
  const sourceNames = formData.getAll("sourceName").map((value) => String(value));

  for (const sourceName of sourceNames) {
    const pickOptionId = String(formData.get(`pickOptionId-${sourceName}`) ?? "");

    if (!sourceName || !validGolferIds.has(pickOptionId)) continue;

    const normalizedSourceName = normalizeGolfName(sourceName);

    await db.execute(sql`
      insert into pick_option_aliases (
        pool_id,
        pick_option_id,
        source_name,
        normalized_source_name
      )
      values (
        ${pool.id},
        ${pickOptionId},
        ${sourceName},
        ${normalizedSourceName}
      )
      on conflict (pool_id, normalized_source_name)
      do update set
        pick_option_id = excluded.pick_option_id,
        source_name = excluded.source_name
    `);
  }

  redirect(`/admin/pools/${pool.slug}/golf/aliases?saved=1`);
}