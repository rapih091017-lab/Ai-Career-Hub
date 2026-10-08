/**
 * Skema validasi dan normalisasi untuk API Job Tracker. Dipisah dari file
 * route karena route handler Next.js hanya boleh mengekspor HTTP methods.
 */
import { z } from "zod";
import { TRACKER_LIMITS } from "./tracker";

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

/** Body tambah lowongan. Field teks menerima string kosong (dinormalkan ke
 * null oleh cleanText) supaya form HTML tidak perlu konversi sendiri. */
export const jobBodySchema = z.object({
  title: z.string().trim().min(1, "Judul lowongan wajib diisi").max(TRACKER_LIMITS.title),
  company: optionalText(TRACKER_LIMITS.company),
  location: optionalText(TRACKER_LIMITS.location),
  url: optionalText(TRACKER_LIMITS.url),
  description: optionalText(TRACKER_LIMITS.description),
  salaryNote: optionalText(TRACKER_LIMITS.salaryNote),
  notes: optionalText(TRACKER_LIMITS.notes),
  contactName: optionalText(TRACKER_LIMITS.contactName),
  contactInfo: optionalText(TRACKER_LIMITS.contactInfo),
  appliedAt: z.string().trim().nullable().optional(),
  stageId: z.string().uuid("Tahap tidak valid").optional(),
  cvId: z.string().uuid().nullable().optional(),
  coverLetterId: z.string().uuid().nullable().optional(),
});

/** PATCH juga menerima `position` untuk drag-drop: UI mengirim stageId baru
 * plus posisi hasil drop (nilai tengah dua kartu, karena posisi sparse). */
export const updateJobSchema = jobBodySchema.partial().extend({
  position: z.number().int().optional(),
});

export function cleanText(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseDateOrNull(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
