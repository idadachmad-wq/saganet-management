import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { parseRole } from "@/lib/rbac";
import { ensureProfileForAuthUser, getProfile } from "@/lib/db";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

function createAuthSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di file .env",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { data, error } = await createAuthSupabaseClient().auth.signInWithPassword(
          {
            email: parsed.data.email,
            password: parsed.data.password,
          },
        );

        if (error || !data.user) return null;

        try {
          const profile = await ensureProfileForAuthUser({
            id: data.user.id,
            email: data.user.email,
            user_metadata: data.user.user_metadata as Record<string, unknown>,
          });

          return {
            id: data.user.id,
            name: profile.name || data.user.email?.split("@")[0] || "Pengguna",
            email: data.user.email ?? parsed.data.email,
            role: parseRole(profile.role),
          };
        } catch {
          // Jangan escalate ke super_admin — gagalkan login
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
        token.name = user.name;
        return token;
      }

      const userId = typeof token.id === "string" ? token.id : undefined;
      if (!userId) return token;

      try {
        const profile = await getProfile(userId);
        if (!profile) {
          // Profil hilang / dicabut → invalidate session
          token.role = undefined;
          token.id = undefined;
          return token;
        }
        token.role = profile.role;
        token.name = profile.name || token.name;
      } catch {
        // Biarkan role lama jika DB sementara gagal; jangan escalate
      }

      return token;
    },
    session({ session, token }) {
      if (!token.id || !token.role) {
        return {
          ...session,
          user: {
            ...session.user,
            id: "",
            role: undefined as never,
            name: null,
            email: null,
          },
        };
      }
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = parseRole(token.role);
        if (typeof token.name === "string") {
          session.user.name = token.name;
        }
      }
      return session;
    },
  },
});
