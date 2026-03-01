import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { Role } from "@/types/auth";
import { fetchAccessList } from "./sheets";

// Cache the access list in memory to avoid hitting Sheets API on every auth check
let accessCache: { entries: Map<string, Role>; expiresAt: number } | null = null;
const ACCESS_CACHE_TTL = 60 * 1000; // 1 minute

async function getAccessList(): Promise<Map<string, Role>> {
  const now = Date.now();
  if (accessCache && accessCache.expiresAt > now) {
    return accessCache.entries;
  }

  const list = await fetchAccessList();
  const entries = new Map<string, Role>();
  for (const entry of list) {
    entries.set(entry.email, entry.role);
  }

  accessCache = { entries, expiresAt: now + ACCESS_CACHE_TTL };
  return entries;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;

      try {
        const accessList = await getAccessList();
        if (!accessList.has(email)) {
          return `/login?error=AccessDenied`;
        }
        return true;
      } catch (error) {
        console.error("Failed to check access list:", error);
        return `/login?error=Configuration`;
      }
    },
    async jwt({ token, user }) {
      if (user?.email) {
        try {
          const accessList = await getAccessList();
          token.role = accessList.get(user.email.toLowerCase()) ?? "viewer";
        } catch {
          token.role = "viewer";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as Role) ?? "viewer";
      }
      return session;
    },
  },
};
