import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

const MEMBER_PREFIXES = [
  "/dashboard",
  "/profile",
  "/complete-profile",
  "/sermons",
  "/bible-study",
  "/devotionals",
  "/quotes",
  "/announcements",
  "/evangelism",
  "/leaderboard",
  "/api/points",
  "/api/sermons",
  "/api/bible-study",
  "/api/devotionals",
  "/api/quotes",
  "/api/announcements",
  "/api/evangelism",
];

const ADMIN_PREFIXES = ["/admin", "/api/admin"];

async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as { sub: string; role: string; name: string };
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const needsMember = MEMBER_PREFIXES.some((p) => pathname.startsWith(p));
  const needsAdmin = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));

  if (!needsMember && !needsAdmin) return NextResponse.next();

  const isApiRoute = pathname.startsWith("/api/");
  const token = request.cookies.get("scribe_token")?.value;

  if (!token) {
    if (isApiRoute) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const payload = await verifyToken(token);

    if (needsAdmin && payload.role !== "admin") {
      if (isApiRoute) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    const response = NextResponse.next();
    response.headers.set("x-user-id", payload.sub);
    response.headers.set("x-user-role", payload.role);
    response.headers.set("x-user-name", payload.name);
    return response;
  } catch {
    if (isApiRoute) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/complete-profile/:path*",
    "/sermons/:path*",
    "/bible-study/:path*",
    "/devotionals/:path*",
    "/quotes/:path*",
    "/announcements/:path*",
    "/evangelism/:path*",
    "/leaderboard/:path*",
    "/api/points/:path*",
    "/api/sermons/:path*",
    "/api/bible-study/:path*",
    "/api/devotionals/:path*",
    "/api/quotes/:path*",
    "/api/announcements/:path*",
    "/api/evangelism/:path*",
    "/api/admin/:path*",
    "/admin/:path*",
  ],
};
