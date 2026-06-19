import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { admins, users } from "@/db/schema";

export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  return existingUsers[0] ?? null;
}

export async function getIsAdmin() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return false;
  }

  const adminRows = await db
    .select()
    .from(admins)
    .where(eq(admins.userId, currentUser.id))
    .limit(1);

  return adminRows.length > 0;
}