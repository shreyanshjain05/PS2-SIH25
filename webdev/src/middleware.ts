import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth"; // We can't use better-auth server in middleware directly on edge usually unless using generic fetch 
// Better Auth recommends using getSession in middleware via a specific helper or just fetching the session endpoint.
// However, since we are using Node.js runtime (implied by Prisma), middleware might be limited.
// Next.js Middleware runs on Edge. Prisma doesn't run on Edge by default without accelerate.
// Better Auth has a specific way to handle middleware.
// For now, I will use a simple fetch to the auth session endpoint or just check for the session cookie existence as a weak check, 
// OR better-auth provides `auth.api.getSession` but that might need edge compatibility.

// Let's implement a basic structure.
export async function middleware(request: NextRequest) {
  // basic check for public routes vs protected
  const path = request.nextUrl.pathname;

  // Placeholder logic until better-auth middleware specific docs are verified or we treat this as a "soft" check.
  // We can check for the session token cookie 'better-auth.session_token'
  const sessionToken = request.cookies.get("better-auth.session_token");

  if (path.startsWith("/dashboard/gov")) {
      if (!sessionToken) {
          return NextResponse.redirect(new URL("/api/auth/signin", request.url));
      }
      // Role check is hard in middleware without decoding token or database call (which we can't do easily on edge with Prisma)
      // We will defer strict role check to the Layout or Page.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/v1/:path*"],
};
