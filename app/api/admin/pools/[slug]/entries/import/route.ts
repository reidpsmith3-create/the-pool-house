import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";

import { db } from "@/db";
import { entries, pools } from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

function parseCsvLine(line: string) {
  return line
    .split(",")
    .map((value) => value.trim().replace(/^"|"$/g, ""));
}

export async function POST(request: Request, context: RouteContext) {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/");

  const { slug } = await context.params;
  const formData = await request.formData();

  const file = formData.get("file");

  if (!(file instanceof File)) {
    redirect(`/admin/pools/${slug}/entries?missing=1`);
  }

  const poolRows = await db
    .select()
    .from(pools)
    .where(eq(pools.slug, slug))
    .limit(1);

  const pool = poolRows[0];
  if (!pool) redirect("/admin");

  const text = await file.text();
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rows = lines.slice(1);

const values: {
  poolId: string;
  participantName: string;
  entryName: string;
  isPaid: boolean;
}[] = [];

for (const line of rows) {
  const [participantName, entryName, paid] = parseCsvLine(line);

  if (!participantName || !entryName) continue;

  values.push({
    poolId: pool.id,
    participantName,
    entryName,
    isPaid: paid?.toLowerCase() === "yes" || paid === "1",
  });
}

if (values.length > 0) {
  for (const value of values) {
    await db.execute(sql`
      insert into entries (pool_id, participant_name, entry_name, is_paid)
      values (${value.poolId}, ${value.participantName}, ${value.entryName}, ${value.isPaid})
    `);
  }
}

  redirect(`/admin/pools/${pool.slug}/entries?created=1`);
}