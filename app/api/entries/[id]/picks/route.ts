import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { entries, entryPicks, pickGroups, pickOptions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth-helpers";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/api/auth/signin");
  }

  const { id } = await context.params;

  const entryRows = await db
    .select()
    .from(entries)
    .where(eq(entries.id, id))
    .limit(1);

  const entry = entryRows[0];

  if (!entry || entry.userId !== currentUser.id) {
    redirect("/");
  }

  const groups = await db
    .select()
    .from(pickGroups)
    .where(eq(pickGroups.poolId, entry.poolId));

  const validOptions = await db
    .select()
    .from(pickOptions)
    .where(eq(pickOptions.poolId, entry.poolId));

  const validOptionIds = new Set(validOptions.map((option) => option.id));

  const formData = await request.formData();

  const selectedOptionIds = groups
    .map((group) => String(formData.get(`group-${group.id}`) ?? ""))
    .filter((optionId) => optionId && validOptionIds.has(optionId));

  await db.delete(entryPicks).where(eq(entryPicks.entryId, entry.id));

  if (selectedOptionIds.length > 0) {
    await db.insert(entryPicks).values(
      selectedOptionIds.map((optionId) => ({
        entryId: entry.id,
        poolId: entry.poolId,
        pickOptionId: optionId,
        metadata: {},
      }))
    );
  }

  redirect(`/entries/${entry.id}?saved=1`);
}