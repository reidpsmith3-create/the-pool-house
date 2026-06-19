import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { entries } from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const isAdmin = await getIsAdmin();

  if (!isAdmin) {
    redirect("/");
  }

  const { id } = await context.params;
  const formData = await request.formData();

  const entryName = String(formData.get("entryName") ?? "").trim();
  const poolSlug = String(formData.get("poolSlug") ?? "").trim();
  const isPaid = formData.get("isPaid") === "on";

  if (!entryName || !poolSlug) {
    redirect("/admin");
  }

  await db
    .update(entries)
    .set({
      entryName,
      isPaid,
      updatedAt: new Date(),
    })
    .where(eq(entries.id, id));

  redirect(`/admin/pools/${poolSlug}/entries`);
}