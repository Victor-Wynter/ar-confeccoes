import type { NextAuthConfig } from "next-auth";

// Config edge-safe (sem DB nem bcrypt) — usado pelo middleware.
// Os providers que tocam o banco entram em auth.ts.
export const authConfig = {
  pages: {
    signIn: "/admin/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname === "/admin/login";

      if (isOnLogin) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/admin", nextUrl));
        }
        return true;
      }

      // Qualquer outra rota /admin/* exige sessão.
      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
