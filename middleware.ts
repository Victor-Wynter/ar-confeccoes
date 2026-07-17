// import NextAuth from "next-auth";
// import { authConfig } from "./auth.config";

// export default NextAuth(authConfig).auth;

// export const config = {
//   matcher: ["/admin/:path*"],
// };

import { NextResponse } from "next/server";

export function middleware() {
  return new NextResponse("Site temporariamente indisponível.", {
    status: 503,
  });
}

export const config = {
  matcher: "/:path*",
};
