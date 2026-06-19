import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { entries, entryPicks, pickGroups, pickOptions, pools } from "@/db/schema";
import { getCurrentUser, getIsAdmin } from "@/lib/auth-helpers";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const currentUser = await getCurrentUser();
  const isAdmin = await getIsAdmin();

  if (!currentUser) {
    redirect("/api/auth/signin");
  }

  const { id } = await context.params;

  const entryRows = await db
    .select({
      entry: entries,
      pool: pools,
    })
    .from(entries)
    .innerJoin(pools, eq(entries.poolId, pools.id))
    .where(eq(entries.id, id))
    .limit(1);

  const row = entryRows[0];

  if (!row || row.entry.userId !== currentUser.id) {
    redirect("/");
  }

  const deadlinePassed =
    row.pool.entryDeadlineAt &&
    new Date(row.pool.entryDeadlineAt).getTime() <= Date.now();

  if (deadlinePassed && !isAdmin) {
    redirect(`/entries/${row.entry.id}?locked=1`);
  }

  const groups = await db
    .select()
    .from(pickGroups)
    .where(eq(pickGroups.poolId, row.entry.poolId));

  const validOptions = await db
    .select()
    .from(pickOptions)
    .where(eq(pickOptions.poolId, row.entry.poolId));

  const validOptionIds = new Set(validOptions.map((option) => option.id));

  const formData = await request.formData();

  const selectedOptionIds = groups
    .map((group) => String(formData.get(`group-${group.id}`) ?? ""))
    .filter((optionId) => optionId && validOptionIds.has(optionId));

  await db.delete(entryPicks).where(eq(entryPicks.entryId, row.entry.id));

  if (selectedOptionIds.length > 0) {
    await db.insert(entryPicks).values(
      selectedOptionIds.map((optionId) => ({
        entryId: row.entry.id,
        poolId: row.entry.poolId,
        pickOptionId: optionId,
        metadata: {},
      }))
    );
  }

  redirect(`/entries/${row.entry.id}?saved=1`);
}