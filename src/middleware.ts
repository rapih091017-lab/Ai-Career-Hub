import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

/* ───────── Protected Routes ───────── */
const PROTECTED_ROUTES = ["/dashboard", "/builder", "/profile", "/portfolio", "/settings", "/cv"];
const AUTH_ROUTES = ["/login"];
const AUTH_API_PREFIX = "/api/auth";

/**
 * Edge-compatible auth check.
 * Uses jose (Edge-safe) to verify NextAuth JWT directly,
 * instead of importing auth() which pulls bcryptjs + postgres (Node.js only).
 */
async function getSessionFromToken(request: NextRequest) {
  // NextAuth v5 stores the JWT in a cookie.
  // On HTTPS (Vercel production), it uses __Secure- prefix.
  const cookieNames = [
    "__Secure-authjs.session-token",
    "authjs.session-token",
    "__Host-authjs.session-token",
  ];
  let token: string | undefined;
  for (const name of cookieNames) {
    const val = request.cookies.get(name)?.value;
    if (val) {
      token = val;
      break;
    }
  }
  if (!token) return null;

  try {
    const AUTH_SECRET = process.env.AUTH_SECRET;
    if (!AUTH_SECRET) return null;

    const secret = new TextEncoder().encode(AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Skip auth checks for OAuth callback URLs ──
  if (pathname.startsWith(AUTH_API_PREFIX)) {
    return NextResponse.next();
  }

  // ── Check session via JWT (Edge-safe) ──
  const session = await getSessionFromToken(request);
  const isAuthenticated = !!session?.sub;

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
