import { NextResponse } from "next/server";

import { db } from "@/db";
import { pools } from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: Request) {
  const isAdmin = await getIsAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const formData = await request.formData();

  const title = String(formData.get("title") ?? "").trim();
const poolType = String(formData.get("poolType") ?? "").trim();
const status = String(formData.get("status") ?? "draft").trim();
const description = String(formData.get("description") ?? "").trim();
  const rules = String(formData.get("rules") ?? "").trim();
  const entryFee = String(formData.get("entryFee") ?? "").trim();
  const maxEntriesPerUser = Number(formData.get("maxEntriesPerUser") ?? 1);
  const isPublished = formData.get("isPublished") === "on";

  if (!title || !poolType) {
    return NextResponse.json(
      { error: "Title and pool type are required." },
      { status: 400 }
    );
  }

  const slug = slugify(title);

  try {
    await db.insert(pools).values({
      title,
      slug,
      poolType,
      description: description || null,
      rules: rules || null,
      entryFee: entryFee || null,
      maxEntriesPerUser: Number.isFinite(maxEntriesPerUser)
        ? maxEntriesPerUser
        : 1,
      isPublished,
status,
    });

    return NextResponse.json({ slug });
  } catch {
    return NextResponse.json(
      { error: "Could not create pool. The title may already exist." },
      { status: 500 }
    );
  }
}