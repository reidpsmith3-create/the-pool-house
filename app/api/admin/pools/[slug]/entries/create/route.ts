import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { entries, pools } from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/");

  const { slug } = await context.params;
  const formData = await request.formData();

  const participantName = String(formData.get("participantName") ?? "").trim();
  const entryName = String(formData.get("entryName") ?? "").trim();
  const isPaid = formData.get("isPaid") === "on";

  if (!participantName || !entryName) {
    redirect(`/admin/pools/${slug}/entries?missing=1`);
  }

  const poolRows = await db
    .select()
    .from(pools)
    .where(eq(pools.slug, slug))
    .limit(1);

  const pool = poolRows[0];
  if (!pool) redirect("/admin");

  await db.insert(entries).values({
    poolId: pool.id,
    userId: null,
    participantName,
    entryName,
    isPaid,
  });

  redirect(`/admin/pools/${pool.slug}/entries?created=1`);
}