import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { pools } from "@/db/schema";
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

  if (!pool) {
    redirect("/admin");
  }

  const title = String(formData.get("title") ?? "").trim();
  const status = String(formData.get("status") ?? "draft").trim();
  const description = String(formData.get("description") ?? "").trim();
  const rules = String(formData.get("rules") ?? "").trim();

  const entryDeadlineAtRaw = String(
    formData.get("entryDeadlineAt") ?? ""
  ).trim();

  if (!title) {
    redirect(`/admin/pools/${slug}/edit`);
  }

  const existingScoringSettings =
    pool.scoringSettings && typeof pool.scoringSettings === "object"
      ? pool.scoringSettings
      : {};

  const winnerBonus = Math.max(
    0,
    Number(formData.get("winnerBonus") ?? 0)
  );

  const topFiveBonus = Math.max(
    0,
    Number(formData.get("topFiveBonus") ?? 0)
  );

  const scoresToCount = Math.max(
    1,
    Number(formData.get("scoresToCount") ?? 4)
  );
  const missedCutScoreRaw = String(
  formData.get("missedCutScore") ?? ""
).trim();

const missedCutScore =
  missedCutScoreRaw === ""
    ? null
    : Math.max(1, Number(missedCutScoreRaw));

  const scoringSettings =
    pool.poolType === "golf"
      ? {
          ...existingScoringSettings,
          winnerBonus: Number.isFinite(winnerBonus) ? winnerBonus : 0,
          topFiveBonus: Number.isFinite(topFiveBonus) ? topFiveBonus : 0,
          scoresToCount: Number.isFinite(scoresToCount)
            ? Math.floor(scoresToCount)
            : 4,
            missedCutScore:
  missedCutScore !== null &&
  Number.isFinite(missedCutScore)
    ? Math.floor(missedCutScore)
    : null,
          golfBonusStacking: "winner_overrides_top_five",
        }
      : existingScoringSettings;

  await db
    .update(pools)
    .set({
      title,
      status,
      description: description || null,
      rules: rules || null,
      entryDeadlineAt: entryDeadlineAtRaw
        ? new Date(entryDeadlineAtRaw)
        : null,
      scoringSettings,
      updatedAt: new Date(),
    })
    .where(eq(pools.id, pool.id));

  redirect(`/admin/pools/${slug}`);
}