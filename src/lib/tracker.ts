/**
 * Konstanta bersama Job Tracker. Dipakai API routes dan UI supaya
 * palet warna, tahap default, dan strategi urutan kartu tidak drift.
 */

export const STAGE_COLORS = [
  "slate",
  "teal",
  "sky",
  "amber",
  "violet",
  "rose",
  "emerald",
  "orange",
] as const;

export type StageColor = (typeof STAGE_COLORS)[number];

export function isStageColor(value: unknown): value is StageColor {
  return typeof value === "string" && (STAGE_COLORS as readonly string[]).includes(value);
}

/** Tahap awal saat user pertama membuka tracker. Nama sengaja Bahasa
 * Indonesia (pasar utama); user bebas rename, tambah, atau hapus. */
export const DEFAULT_STAGES: { name: string; color: StageColor }[] = [
  { name: "Tersimpan", color: "slate" },
  { name: "Dilamar", color: "sky" },
  { name: "Interview", color: "amber" },
  { name: "Offer", color: "emerald" },
  { name: "Ditolak", color: "rose" },
];

export const MAX_STAGES = 12;

/** Jarak antar kartu saat insert. Posisi sengaja sparse: drop di antara
 * dua kartu cukup memakai nilai tengahnya, tanpa menulis ulang kartu lain. */
export const POSITION_GAP = 1024;

export const TRACKER_LIMITS = {
  title: 255,
  company: 255,
  location: 300,
  url: 2000,
  salaryNote: 120,
  contactName: 120,
  contactInfo: 255,
  notes: 5000,
  description: 20000,
  stageName: 60,
} as const;
