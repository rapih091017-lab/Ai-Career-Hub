import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { usageLogs } from "@/db/schema";
import { eventActionType, type EventProps, type FunnelEvent } from "@/lib/events";

interface RecordEventInput {
  name: FunnelEvent;
  userId?: string | null;
  anonId?: string | null;
  props?: EventProps;
  /** uuid terkait (payment, CV). */
  resourceId?: string | null;
  /** Lewati bila event yang sama untuk resourceId ini sudah tercatat (mis. purchase dari webhook dan polling). */
  oncePerResource?: boolean;
}

/**
 * Catat satu event funnel ke usage_logs. Tidak pernah melempar: kegagalan
 * pencatatan tidak boleh menggagalkan pembayaran, unduhan, atau pendaftaran.
 * IP tidak disimpan; yang disimpan hanya anon id browser bila ada.
 */
export async function recordEvent(input: RecordEventInput): Promise<void> {
  const actionType = eventActionType(input.name);
  try {
    if (input.oncePerResource && input.resourceId) {
      const [existing] = await db
        .select({ id: usageLogs.id })
        .from(usageLogs)
        .where(and(eq(usageLogs.actionType, actionType), eq(usageLogs.resourceId, input.resourceId)))
        .limit(1);
      if (existing) return;
    }
    const hasMeta = Boolean(input.anonId) || (input.props && Object.keys(input.props).length > 0);
    await db.insert(usageLogs).values({
      userId: input.userId ?? null,
      anonymousFingerprint: hasMeta
        ? { ip: "", cookieHash: "", ...(input.anonId ? { anonId: input.anonId } : {}), ...(input.props ? { props: input.props } : {}) }
        : null,
      actionType,
      resourceId: input.resourceId ?? null,
    });
  } catch (error) {
    console.error(`[events] gagal mencatat ${actionType}:`, error instanceof Error ? error.message : error);
  }
}
