import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes (except /admin/login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const authCookie = request.cookies.get("redirect-admin-auth")?.value;

    if (!authCookie) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // Verify cookie content
    try {
      const decoded = Buffer.from(authCookie, "base64").toString();
      const adminPassword = process.env.ADMIN_PASSWORD || "admin";
      if (decoded !== `authenticated:${adminPassword}`) {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
