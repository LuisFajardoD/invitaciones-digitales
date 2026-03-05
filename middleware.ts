import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/constants";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const isAdminRoot = pathname === "/admin";
  const isAdminLogin = pathname === "/admin/login";
  const isProtectedAdminRoute = pathname.startsWith("/admin") && !isAdminRoot && !isAdminLogin;

  if (isAdminRoot && !token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoot && token) {
    const adminHomeUrl = request.nextUrl.clone();
    adminHomeUrl.pathname = "/admin/invitations";
    adminHomeUrl.search = "";
    return NextResponse.redirect(adminHomeUrl);
  }

  if (isProtectedAdminRoute && !token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = `?redirect=${encodeURIComponent(`${pathname}${request.nextUrl.search}`)}`;
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
