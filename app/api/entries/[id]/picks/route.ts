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

  if (!row) {
    redirect("/");
  }

  if (row.entry.userId !== currentUser.id && !isAdmin) {
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
const selectedOptionIdsByGroup = new Map<string, string[]>();

for (const group of groups) {
  const selectedForGroup = formData
    .getAll(`group-${group.id}`)
    .map((value) => String(value))
    .filter((optionId) => optionId && validOptionIds.has(optionId));

  if (selectedForGroup.length < group.minPicks) {
    redirect(`/entries/${row.entry.id}?saved=0`);
  }

  selectedOptionIdsByGroup.set(
    group.id,
    selectedForGroup.slice(0, group.maxPicks)
  );
}

const selectedOptionIds = Array.from(
  new Set(Array.from(selectedOptionIdsByGroup.values()).flat())
);

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