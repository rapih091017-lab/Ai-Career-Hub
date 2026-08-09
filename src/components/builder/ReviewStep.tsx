"use client";

import Link from "next/link";
import type { CvData } from "@/components/cv-templates";
import { useCoverLetterQuota } from "@/hooks/useCoverLetterQuota";

interface ReviewStepProps {
  cvData: CvData;
  sectionCompletion: boolean[];
  customSections: { id: string; content?: string }[];
  cvId?: string;
}

export function ReviewStep({ cvData, sectionCompletion, customSections, cvId }: ReviewStepProps) {
  const quota = useCoverLetterQuota();
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-label-bold text-on-surface">Ringkasan CV</h3>
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className={`w-5 h-1 rounded-full transition-colors duration-500 ${
                    sectionCompletion[idx] ? "bg-primary" : "bg-outline-variant/50"
                  } ml-0.5 first:ml-0`}
                />
              ))}
            </div>
            <span className="text-[10px] font-bold text-primary">
              {sectionCompletion.filter(Boolean).length}/6
            </span>
          </div>
        </div>
        <div className="space-y-2 text-body-md">
          <p className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-green-600 text-base"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              check_circle
            </span>
            <span className="text-on-surface font-medium">Profil:</span>
            <span className="text-outline">{cvData.fullName || "\u2014"}</span>
          </p>
          <p className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-green-600 text-base"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              check_circle
            </span>
            <span className="text-on-surface font-medium">Pengalaman Kerja:</span>
            <span className="text-outline">{cvData.workHistory.length} posisi</span>
          </p>
          <p className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-green-600 text-base"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              check_circle
            </span>
            <span className="text-on-surface font-medium">Pendidikan:</span>
            <span className="text-outline">{cvData.education.length} institusi</span>
          </p>
          <p className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-green-600 text-base"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              check_circle
            </span>
            <span className="text-on-surface font-medium">Organisasi:</span>
            <span className="text-outline">{cvData.organisations.length} organisasi</span>
          </p>
          <p className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-green-600 text-base"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              check_circle
            </span>
            <span className="text-on-surface font-medium">Skill:</span>
            <span className="text-outline">{cvData.skills.length} keahlian</span>
          </p>
        </div>
      </div>
      <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3">
        <span
          className="material-symbols-outlined text-primary shrink-0"
          style={{ fontVariationSettings: "'FILL' 1" }}
          aria-hidden="true"
        >
          task_alt
        </span>
        <p className="text-sm text-on-surface-variant">
          Pastikan semua data sudah lengkap sebelum menyimpan. Kamu bisa kembali ke step sebelumnya kapan saja.
        </p>
      </div>

      {/* ── Surat Lamaran / Motivation Letter ── */}
      {cvId && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 px-1">
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Surat Lamaran &amp; Motivation Letter
            </p>
            {quota && !quota.isUnlimited && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>redeem</span>
                Sisa {quota.remaining}/{quota.limit} gratis
              </span>
            )}
            {quota && quota.isUnlimited && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 whitespace-nowrap">
                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                Unlimited Premium
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href={`/surat-lamaran/${cvId}?style=formal`}
              className="group flex items-center gap-3 bg-white rounded-xl p-4 border border-outline-variant/50 hover:border-primary/40 hover:shadow-premium-md transition-all active:scale-[0.99]"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <span
                  className="material-symbols-outlined text-primary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >
                  markunread_mailbox
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-on-surface">Surat Lamaran Formal</p>
                <p className="text-[11px] text-on-surface-variant">Resmi · tanpa kop surat</p>
              </div>
              <span
                className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors shrink-0"
                aria-hidden="true"
              >
                arrow_forward
              </span>
            </Link>
            <Link
              href={`/surat-lamaran/${cvId}?style=formal_lengkap`}
              className="group flex items-center gap-3 bg-white rounded-xl p-4 border border-outline-variant/50 hover:border-primary/40 hover:shadow-premium-md transition-all active:scale-[0.99]"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <span
                  className="material-symbols-outlined text-primary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >
                  business_center
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-on-surface">Formal + Kop Surat</p>
                <p className="text-[11px] text-on-surface-variant">Nomor · lampiran · BUMN/korporasi</p>
              </div>
              <span
                className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors shrink-0"
                aria-hidden="true"
              >
                arrow_forward
              </span>
            </Link>
            <Link
              href={`/surat-lamaran/${cvId}?style=ats`}
              className="group flex items-center gap-3 bg-white rounded-xl p-4 border border-outline-variant/50 hover:border-primary/40 hover:shadow-premium-md transition-all active:scale-[0.99]"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <span
                  className="material-symbols-outlined text-teal-600"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >
                  auto_awesome
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-on-surface">Cover Letter (EN/ATS)</p>
                <p className="text-[11px] text-on-surface-variant">English · keyword-friendly</p>
              </div>
              <span
                className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors shrink-0"
                aria-hidden="true"
              >
                arrow_forward
              </span>
            </Link>
            <Link
              href={`/surat-lamaran/${cvId}?style=casual`}
              className="group flex items-center gap-3 bg-white rounded-xl p-4 border border-outline-variant/50 hover:border-primary/40 hover:shadow-premium-md transition-all active:scale-[0.99]"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <span
                  className="material-symbols-outlined text-rose-500"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >
                  waving_hand
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-on-surface">Surat Kasual</p>
                <p className="text-[11px] text-on-surface-variant">Hangat · startup/kreatif</p>
              </div>
              <span
                className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors shrink-0"
                aria-hidden="true"
              >
                arrow_forward
              </span>
            </Link>
            <Link
              href={`/surat-lamaran/${cvId}?style=motivation`}
              className="group flex items-center gap-3 bg-white rounded-xl p-4 border border-outline-variant/50 hover:border-amber-400/60 hover:shadow-premium-md transition-all active:scale-[0.99] sm:col-span-2"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <span
                  className="material-symbols-outlined text-amber-600"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >
                  emoji_events
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-on-surface">Motivation Letter</p>
                <p className="text-[11px] text-on-surface-variant">Beasiswa · Program · Fresh grad</p>
              </div>
              <span
                className="material-symbols-outlined text-on-surface-variant group-hover:text-amber-500 transition-colors shrink-0"
                aria-hidden="true"
              >
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
