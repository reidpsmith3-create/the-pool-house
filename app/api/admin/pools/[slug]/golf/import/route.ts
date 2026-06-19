import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { pickGroups, pickOptions, pools } from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

function parseCsv(csv: string) {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const [headerLine, ...dataLines] = lines;

  if (!headerLine) {
    return [];
  }

  const headers = headerLine.split(",").map((header) => header.trim());

  return dataLines.map((line) => {
    const values = line.split(",").map((value) => value.trim());
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });

    return row;
  });
}

export async function POST(request: Request, context: RouteContext) {
  const isAdmin = await getIsAdmin();

  if (!isAdmin) {
    redirect("/");
  }

  const { slug } = await context.params;

  const poolRows = await db
    .select()
    .from(pools)
    .where(eq(pools.slug, slug))
    .limit(1);

  const pool = poolRows[0];

  if (!pool) {
    redirect("/admin");
  }

  const formData = await request.formData();
  const csv = String(formData.get("csv") ?? "");

  const rows = parseCsv(csv).filter(
    (row) => row.group_name && row.golfer_name
  );

  if (rows.length === 0) {
    redirect(`/admin/pools/${pool.slug}/golf/setup`);
  }

  const groupNames = Array.from(new Set(rows.map((row) => row.group_name)));

  const createdGroups = await db
    .insert(pickGroups)
    .values(
      groupNames.map((name, index) => ({
        poolId: pool.id,
        name,
        sortOrder: index + 1,
        minPicks: 1,
        maxPicks: 1,
      }))
    )
    .returning();

  const groupIdByName = new Map(
    createdGroups.map((group) => [group.name, group.id])
  );

  await db.insert(pickOptions).values(
    rows.map((row) => ({
      poolId: pool.id,
      groupId: groupIdByName.get(row.group_name),
      name: row.golfer_name,
      displayName: row.display_name || row.golfer_name,
      sourceId: row.source_id || null,
      sourceName: row.source_name || null,
      metadata: {},
    }))
  );

  redirect(`/pools/${pool.slug}`);
}