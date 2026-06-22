import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { pickGroups, pickOptions, pools } from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/");

  const { slug } = await context.params;
  const formData = await request.formData();

  const question = String(formData.get("question") ?? "").trim();
  const choicesText = String(formData.get("choices") ?? "").trim();

  if (!question || !choicesText) {
    redirect(`/admin/pools/${slug}/predictions/setup`);
  }

  const poolRows = await db
    .select()
    .from(pools)
    .where(eq(pools.slug, slug))
    .limit(1);

  const pool = poolRows[0];
  if (!pool) redirect("/admin");

  if (pool.poolType !== "predictions") {
    redirect(`/admin/pools/${pool.slug}`);
  }

  const existingGroups = await db
    .select()
    .from(pickGroups)
    .where(eq(pickGroups.poolId, pool.id));

  const createdGroups = await db
    .insert(pickGroups)
    .values({
      poolId: pool.id,
      name: question,
      sortOrder: existingGroups.length + 1,
      minPicks: 1,
      maxPicks: 1,
    })
    .returning();

  const createdGroup = createdGroups[0];

  const choices = choicesText
    .split(/\r?\n/)
    .map((choice) => choice.trim())
    .filter(Boolean);

  const uniqueChoices = Array.from(new Set(choices));

  if (uniqueChoices.length > 0) {
    await db.insert(pickOptions).values(
      uniqueChoices.map((choice) => ({
        poolId: pool.id,
        groupId: createdGroup.id,
        name: choice,
        displayName: choice,
      }))
    );
  }

  redirect(`/admin/pools/${pool.slug}/predictions/setup?created=1`);
}