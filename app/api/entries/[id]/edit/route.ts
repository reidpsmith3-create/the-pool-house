import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { entries } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth-helpers";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: Request,
  context: RouteContext
) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/api/auth/signin");
  }

  const { id } = await context.params;

  const formData = await request.formData();

  const entryName = String(
    formData.get("entryName") ?? ""
  ).trim();

  await db
    .update(entries)
    .set({
      entryName,
      updatedAt: new Date(),
    })
    .where(eq(entries.id, id));

  redirect(`/entries/${id}`);
}