import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Weak check (cookie present) that runs on the edge without a DB call: it
// sends signed-out visitors to sign-in instead of showing an empty dashboard.
// The API still validates the session on every request.
// getSessionCookie handles the "__Secure-" prefix better-auth uses over HTTPS.
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith("/dashboard") || path.startsWith("/gov-dashboard")) {
    if (!getSessionCookie(request)) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
    // Role checks happen in the layout/page, where the DB is available
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/gov-dashboard/:path*"],
};
