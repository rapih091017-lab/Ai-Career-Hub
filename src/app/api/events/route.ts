import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { apiHandler, errorResponse } from "@/lib/api-utils";
import { checkRateLimit, clientIp, rateLimitResponse } from "@/lib/rate-limiter";
import { EVENT_BODY_MAX_BYTES, eventBodySchema } from "@/lib/events";
import { recordEvent } from "@/lib/events.server";

const ANON_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

/**
 * POST /api/events: catat satu event funnel dari browser.
 * Nama event dari whitelist klien (event server seperti purchase ditolak),
 * body maks 1 KB, rate limit per IP dan per anon id.
 */
export const POST = apiHandler(async (request: NextRequest) => {
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > EVENT_BODY_MAX_BYTES) {
    return errorResponse("PAYLOAD_TOO_LARGE", "Event terlalu besar.", 413);
  }

  const headerAnon = request.headers.get("x-anon-id")?.trim() ?? "";
  const anonId = ANON_ID_PATTERN.test(headerAnon) ? headerAnon : null;

  const ip = clientIp(request);
  const byIp = checkRateLimit({ key: `events:ip:${ip}`, maxRequests: 120, windowSeconds: 60 });
  if (!byIp.allowed) return rateLimitResponse(byIp.resetInSeconds);
  if (anonId) {
    const byAnon = checkRateLimit({ key: `events:anon:${anonId}`, maxRequests: 40, windowSeconds: 60 });
    if (!byAnon.allowed) return rateLimitResponse(byAnon.resetInSeconds);
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return errorResponse("INVALID_INPUT", "Event tidak valid.", 400);
  }
  const parsed = eventBodySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("INVALID_INPUT", "Event tidak valid.", 400);
  }

  const session = await auth().catch(() => null);
  await recordEvent({
    name: parsed.data.name,
    userId: session?.user?.id ?? null,
    anonId,
    props: parsed.data.props,
  });

  return new NextResponse(null, { status: 204 });
});
