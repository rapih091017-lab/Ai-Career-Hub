import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

/* ───────── Protected Routes ───────── */
const PROTECTED_ROUTES = [
  "/dashboard",
  "/builder",
  "/profile",
  "/portfolio",
  "/settings",
  "/cv",
];

const AUTH_ROUTES = ["/login"];
const AUTH_API_PREFIX = "/api/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Skip auth checks for OAuth callback URLs ──
  if (pathname.startsWith(AUTH_API_PREFIX)) {
    return NextResponse.next();
  }

  // ── Check session via NextAuth JWT ──
  const session = await auth();
  const isAuthenticated = !!session?.user?.id;

  // ── Auth: protect routes ──
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthPage = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Auth: redirect logged-in users away from login ──
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ── Security Headers ──
  const response = NextResponse.next();

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://api.midtrans.com https://api.sandbox.midtrans.com https://va.vercel-scripts.com",
    "frame-src 'self' https://app.midtrans.com https://api.sandbox.midtrans.com",
    "manifest-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

  if (pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|og-image.png|apple-icon.png|icon.png).*)",
  ],
};
