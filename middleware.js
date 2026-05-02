import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

const protectedPaths = ["/dashboard", "/admin", "/profile", "/my-tasks"];
const authPages = ["/login", "/register"];

function isUnder(pathname, base) {
  return pathname === base || pathname.startsWith(`${base}/`);
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;
  const payload = await verifyToken(token);
  const authed = Boolean(payload?.sub);
  const role = typeof payload?.role === "string" ? payload.role : null;

  const needsAuth = protectedPaths.some((p) => isUnder(pathname, p));

  if (needsAuth && !authed) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isUnder(pathname, "/admin") && authed && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (authPages.some((p) => pathname === p) && authed) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/admin",
    "/admin/:path*",
    "/profile",
    "/profile/:path*",
    "/my-tasks",
    "/my-tasks/:path*",
    "/login",
    "/register",
  ],
};
