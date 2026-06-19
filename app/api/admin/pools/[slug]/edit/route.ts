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

  const title = String(formData.get("title") ?? "").trim();
  const status = String(formData.get("status") ?? "draft").trim();
  const description = String(formData.get("description") ?? "").trim();
  const rules = String(formData.get("rules") ?? "").trim();
  const entryDeadlineAtRaw = String(
  formData.get("entryDeadlineAt") ?? ""
).trim();

  if (!title) redirect(`/admin/pools/${slug}/edit`);

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
updatedAt: new Date(),
    })
    .where(eq(pools.slug, slug));

  redirect(`/pools/${slug}`);
}