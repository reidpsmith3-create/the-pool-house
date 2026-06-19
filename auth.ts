import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { db } from "@/db";
import { users } from "@/db/schema";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        return false;
      }

      const existingUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, user.email))
        .limit(1);

      if (existingUsers.length === 0) {
        await db.insert(users).values({
          email: user.email,
          name: user.name,
          image: user.image,
        });
      }

      return true;
    },
  },
});