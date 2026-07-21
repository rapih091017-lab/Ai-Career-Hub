import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* ───────── Auth API prefix (jangan diotak-atik middleware) ───────── */
const AUTH_API_PREFIX = "/api/auth";

/**
 * Middleware — hanya handle security headers.
 * Auth protection dilakukan oleh AuthGuard component di client-side.
 * (Middleware tidak bisa verify NextAuth JWT dengan reliable di Edge Runtime)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Skip OAuth callback URLs ──
  if (pathname.startsWith(AUTH_API_PREFIX)) {
    return NextResponse.next();
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
