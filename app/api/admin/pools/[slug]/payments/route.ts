import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { entries } from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function POST(
  request: Request,
  context: RouteContext
) {
  const isAdmin = await getIsAdmin();

  if (!isAdmin) {
    redirect("/");
  }

  const { slug } = await context.params;

  const formData = await request.formData();

  const entryId = String(formData.get("entryId"));
  const isPaid = String(formData.get("isPaid")) === "true";

  await db
    .update(entries)
    .set({
      isPaid,
      updatedAt: new Date(),
    })
    .where(eq(entries.id, entryId));

  redirect(`/admin/pools/${slug}/payments`);
}