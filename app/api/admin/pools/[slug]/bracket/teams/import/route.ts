import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { bracketTeams, pools } from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (const char of line) {
    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

export async function POST(request: Request, context: RouteContext) {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/");

  const { slug } = await context.params;

  const poolRows = await db
    .select()
    .from(pools)
    .where(eq(pools.slug, slug))
    .limit(1);

  const pool = poolRows[0];
  if (!pool) redirect("/admin");

  if (pool.poolType !== "bracket") {
    redirect(`/admin/pools/${pool.slug}`);
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const clearExisting = formData.get("clearExisting") === "on";

  if (!file) {
    redirect(`/admin/pools/${pool.slug}/bracket/setup?importFailed=1`);
  }

  const text = await file.text();
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    redirect(`/admin/pools/${pool.slug}/bracket/setup?importFailed=1`);
  }

  const header = parseCsvLine(lines[0]).map((value) =>
    value.toLowerCase().trim()
  );

  const seedIndex = header.indexOf("seed");
  const teamIndex =
    header.indexOf("team") >= 0
      ? header.indexOf("team")
      : header.indexOf("name");
  const regionIndex =
    header.indexOf("region") >= 0
      ? header.indexOf("region")
      : header.indexOf("conference");

  if (seedIndex === -1 || teamIndex === -1) {
    redirect(`/admin/pools/${pool.slug}/bracket/setup?importFailed=1`);
  }

  const teamsToInsert: (typeof bracketTeams.$inferInsert)[] = [];

  for (const line of lines.slice(1)) {
    const values = parseCsvLine(line);

    const seed = Number(values[seedIndex]);
    const name = String(values[teamIndex] ?? "").trim();
    const region =
      regionIndex >= 0
        ? String(values[regionIndex] ?? "").trim() || null
        : null;

    if (!Number.isInteger(seed) || seed < 1 || !name) continue;

    teamsToInsert.push({
      poolId: pool.id,
      seed,
      name,
      region,
    });
  }

  if (teamsToInsert.length === 0) {
    redirect(`/admin/pools/${pool.slug}/bracket/setup?importFailed=1`);
  }

  if (clearExisting) {
    await db.delete(bracketTeams).where(eq(bracketTeams.poolId, pool.id));
  }

  await db.insert(bracketTeams).values(teamsToInsert);

  redirect(`/admin/pools/${pool.slug}/bracket/setup?teamsImported=1`);
}