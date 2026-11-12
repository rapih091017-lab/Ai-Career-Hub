import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { apiHandler, errorResponse } from "@/lib/api-utils";
import { checkRateLimit, clientIp, rateLimitResponse } from "@/lib/rate-limiter";
import { and, count, gte, like, sql } from "drizzle-orm";
import { db } from "@/db";
import { usageLogs } from "@/db/schema";
import { EVENT_ACTION_LIKE, EVENT_BODY_MAX_BYTES, eventBodySchema } from "@/lib/events";
import { recordEvent } from "@/lib/events.server";

const ANON_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;
/** Batas event per anon id per hari (UTC) untuk pengunjung tanpa sesi. */
const ANON_DAILY_EVENT_MAX = 200;
const DEDUP_WINDOW_MS = 60_000;

/** name+anonId yang sudah dicatat dalam semenit terakhir (per instance). */
const recent = new Map<string, number>();

function seenRecently(key: string, now: number): boolean {
  for (const [k, at] of recent) if (now - at >= DEDUP_WINDOW_MS) recent.delete(k);
  if (recent.has(key)) return true;
  recent.set(key, now);
  return false;
}

async function anonEventsToday(anonId: string): Promise<number> {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const [row] = await db
    .select({ value: count() })
    .from(usageLogs)
    .where(
      and(
        like(usageLogs.actionType, EVENT_ACTION_LIKE),
        gte(usageLogs.createdAt, start),
        sql`${usageLogs.anonymousFingerprint}->>'anonId' = ${anonId}`,
      ),
    );
  return Number(row?.value ?? 0);
}

/**
 * POST /api/events: catat satu event funnel dari browser.
 * Nama event dari whitelist klien (event server seperti purchase ditolak),
 * body maks 1 KB, rate limit per IP dan per anon id. Tanpa sesi: dedup
 * nama+anon id per menit dan batas harian per anon id.
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
  const userId = session?.user?.id ?? null;

  // Tanpa sesi: event yang sama dari browser yang sama dalam semenit dicatat
  // sekali, dan tiap anon id dibatasi per hari. Kelebihan diabaikan diam-diam.
  if (!userId) {
    if (!anonId) return new NextResponse(null, { status: 204 });
    if (seenRecently(`${parsed.data.name}:${anonId}`, Date.now())) return new NextResponse(null, { status: 204 });
    if ((await anonEventsToday(anonId)) >= ANON_DAILY_EVENT_MAX) return new NextResponse(null, { status: 204 });
  }

  await recordEvent({
    name: parsed.data.name,
    userId,
    anonId,
    props: parsed.data.props,
  });

  return new NextResponse(null, { status: 204 });
});
