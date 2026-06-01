import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

const MEMBER_PREFIXES = [
  "/dashboard",
  "/sermons",
  "/bible-study",
  "/devotionals",
  "/quotes",
  "/announcements",
  "/evangelism",
  "/leaderboard",
];

const ADMIN_PREFIXES = ["/admin"];

async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as { sub: string; role: string; name: string };
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const needsMember = MEMBER_PREFIXES.some((p) => pathname.startsWith(p));
  const needsAdmin = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));

  if (!needsMember && !needsAdmin) return NextResponse.next();

  const token = request.cookies.get("scribe_token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const payload = await verifyToken(token);

    if (needsAdmin && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    const response = NextResponse.next();
    response.headers.set("x-user-id", payload.sub);
    response.headers.set("x-user-role", payload.role);
    response.headers.set("x-user-name", payload.name);
    return response;
  } catch {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/sermons/:path*",
    "/bible-study/:path*",
    "/devotionals/:path*",
    "/quotes/:path*",
    "/announcements/:path*",
    "/evangelism/:path*",
    "/leaderboard/:path*",
    "/admin/:path*",
  ],
};
