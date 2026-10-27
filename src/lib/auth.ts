import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { compareSync } from "bcryptjs";
import { redirect } from "next/navigation";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { tenant: true },
        });

        if (!user) return null;

        const valid = compareSync(credentials.password as string, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.nome,
          tenantId: user.tenantId,
          role: user.role,
        };
      },
    }),
  ],
  // Self-hosted behind a reverse proxy: trust the Host header (Auth.js rejects it in production otherwise).
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.tenantId = (user as { tenantId: string }).tenantId;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.tenantId = token.tenantId as string;
      session.user.role = token.role as string;
      return session;
    },
  },
});

/**
 * Returns the signed-in user's tenant ID, or redirects to /login.
 * Pages call this themselves because Next.js renders a page in parallel with
 * its layout, so the layout's redirect alone does not protect the page.
 */
export async function requireTenantId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");
  return session.user.tenantId;
}
