"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import { useTranslation } from "@/lib/i18n";
import AppFooter from "@/components/AppFooter";
import AuthGuard from "@/components/AuthGuard";
import dynamic from "next/dynamic";
const TemplatePicker = dynamic(() => import("@/components/TemplatePicker"), { ssr: false });
import { CV_TEMPLATES } from "@/lib/templates";
import MagneticButton from "@/components/MagneticButton";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal, type ConfirmAction } from "@/components/ui/confirm-modal";
import { DashboardStats } from "@/components/dashboard/DashboardStats";

/* ── Relative time helper ── */
function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return date.toLocaleDateString("id-ID");
}

interface CVItem {
  id: string;
  jobTitle: string | null;
  templateId: string;
  createdAt: string;
  updatedAt: string;
}

interface CheckerHistoryItem {
  id: string;
  scores: { overall: number; keywordGap: number; contextRelevance: number; atsRules: number };
  aiFeedback: { keywordGap: string; contextRelevance: string; atsRules: string; summary: string };
  createdAt: string;
  jobDescription: string;
}

interface ProfileCompleteness {
  score: number;
  sections: { label: string; filled: boolean; key: string }[];
  hasProfile: boolean;
}

function computeCompleteness(data: any): ProfileCompleteness {
  const sections = [
    { label: "Data Pribadi", key: "personal", filled: !!(data?.personalInfo?.fullName || data?.personalInfo?.phone || data?.personalInfo?.email) },
    { label: "Pengalaman Kerja", key: "work", filled: Array.isArray(data?.workHistory) && data.workHistory.length > 0 },
    { label: "Pendidikan", key: "education", filled: Array.isArray(data?.education) && data.education.length > 0 },
    { label: "Organisasi", key: "orgs", filled: Array.isArray(data?.organisations) && data.organisations.length > 0 },
    { label: "Skill", key: "skills", filled: Array.isArray(data?.skills) && data.skills.length > 0 },
  ];
  const filledCount = sections.filter((s) => s.filled).length;
  return { score: Math.round((filledCount / sections.length) * 100), sections, hasProfile: true };
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const router = useRouter();
  const [cvList, setCvList] = useState<CVItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [profileData, setProfileData] = useState<ProfileCompleteness | null>(null);
  const [checkerHistory, setCheckerHistory] = useState<CheckerHistoryItem[]>([]);
  const [checkerHistoryLoading, setCheckerHistoryLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "has-title" | "no-title">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name-asc" | "name-desc">("newest");

  /* ── Filtered & Sorted CV list ── */
  const filteredCvList = useMemo(() => {
    let list = cvList;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((cv) => (cv.jobTitle || "").toLowerCase().includes(q));
    }
    if (filterStatus === "has-title") list = list.filter((cv) => !!cv.jobTitle);
    if (filterStatus === "no-title") list = list.filter((cv) => !cv.jobTitle);
    // Sort
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "newest": return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case "oldest": return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case "name-asc": return (a.jobTitle || "").localeCompare(b.jobTitle || "");
        case "name-desc": return (b.jobTitle || "").localeCompare(a.jobTitle || "");
        default: return 0;
      }
    });
    return list;
  }, [cvList, searchQuery, filterStatus, sortBy]);

  /* ── Stats for the dashboard ── */
  const stats = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentCount = cvList.filter((cv) => new Date(cv.updatedAt) >= sevenDaysAgo).length;
    const completions = cvList.filter((cv) => !!cv.jobTitle).length;
    return { totalCvs: cvList.length, recentCount, completions };
  }, [cvList]);

  /* ── Recent activity (last 5) ── */
  const recentActivity = useMemo(() => {
    return [...cvList]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [cvList]);

  useEffect(() => {
    fetch("/api/cv-documents")
      .then((res) => res.json())
      .then((data) => setCvList(Array.isArray(data) ? data : []))
      .catch(() => setCvList([]))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/profile")
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setProfileData(computeCompleteness(data));
        } else if (res.status === 404) {
          setProfileData({ score: 0, sections: [], hasProfile: false });
        }
      })
      .catch(() => {});
  }, []);

  /* ── Fetch checker history ── */
  useEffect(() => {
    fetch("/api/checker/history")
      .then((res) => res.json())
      .then((data) => setCheckerHistory(Array.isArray(data) ? data : []))
      .catch(() => setCheckerHistory([]))
      .finally(() => setCheckerHistoryLoading(false));
  }, []);

  const handleCreateCV = async (templateId: string, jobTitle?: string) => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/cv-documents/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle: jobTitle || "", jobDescription: "", templateId }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        setShowTemplatePicker(false);
        router.push(`/builder/${data.id}`);
      } else {
        setIsCreating(false);
        if (data.error === "PROFILE_NOT_FOUND") {
          setShowTemplatePicker(false);
          router.push(data.redirectUrl || "/profile");
        } else {
          addToast({ type: "error", message: data.message || t("dashboard.create-failed") });
        }
      }
    } catch {
      setIsCreating(false);
      addToast({ type: "error", message: t("dashboard.server-error") });
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmAction({
      title: "Hapus CV",
      message: t("dashboard.confirm-delete"),
      variant: "danger",
      confirmLabel: "Hapus",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/cv-documents/${id}`, { method: "DELETE" });
          if (res.ok) {
            setCvList((prev) => prev.filter((cv) => cv.id !== id));
            addToast({ type: "success", message: "CV berhasil dihapus" });
          } else addToast({ type: "error", message: t("dashboard.delete-failed") });
        } catch { addToast({ type: "error", message: t("dashboard.delete-failed") }); }
      },
    });
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background text-on-background">
        <AppHeader />
        <main className="pt-24 pb-20 px-margin-mobile md:px-gutter">
          <div className="max-w-[900px] mx-auto">
            {/* Welcome + Profile */}
            <section className="mb-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-headline-lg text-on-background mb-1">{t("dashboard.title")}</h1>
                  <p className="font-body-md text-on-surface-variant">{t("dashboard.subtitle")}</p>
                </div>
                {profileData === null ? (
                  <div className="shrink-0 bg-white rounded-2xl p-4 shadow-premium-sm border border-outline-variant/50 min-w-[200px] animate-pulse">
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-3 bg-surface-container-high rounded w-20" />
                      <div className="h-3 bg-surface-container-high rounded w-8" />
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-high rounded-full mb-2" />
                    <div className="space-y-1">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-surface-container-high" />
                          <div className="h-2.5 bg-surface-container-high rounded w-16" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : profileData && (
                  <Link
                    href="/profile"
                    className="shrink-0 bg-white rounded-2xl p-4 shadow-premium-sm border border-outline-variant/50 hover:shadow-premium-md hover:border-primary/30 transition-shadow group min-w-[200px]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-label-sm font-semibold text-on-surface-variant">
                        {profileData.hasProfile ? t("dashboard.master-profile") : t("dashboard.complete-profile")}
                      </span>
                      {profileData.hasProfile ? (
                        <span className="text-label-sm font-bold text-primary">{profileData.score}%</span>
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-error-container/50 flex items-center justify-center">
                          <span className="material-symbols-outlined text-error text-sm">error_outline</span>
                        </span>
                      )}
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-[width,background-color] duration-500 ${
                          profileData.score >= 80 ? "bg-green-500" : profileData.score >= 40 ? "bg-primary" : "bg-amber-500"
                        }`}
                        style={{ width: `${profileData.score}%` }}
                      />
                    </div>
                    {profileData.hasProfile && (
                      <div className="space-y-0.5">
                        {profileData.sections.map((s) => (
                          <div key={s.key} className="flex items-center gap-1">
                            <span className={`material-symbols-outlined text-[12px] ${s.filled ? "text-green-600" : "text-outline-variant"}`}>
                              {s.filled ? "check_circle" : "radio_button_unchecked"}
                            </span>
                            <span className={`text-[10px] ${s.filled ? "text-green-700" : "text-outline"}`}>{s.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {!profileData.hasProfile && (
                      <p className="text-[10px] text-error">{t("dashboard.profile-warning")}</p>
                    )}
                  </Link>
                )}
              </div>
            </section>

            {/* Quick Actions — staggered entry */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {[
                { icon: "edit_document", label: t("dashboard.new-cv"), desc: t("dashboard.new-cv-desc"), color: "bg-primary-fixed", iconColor: "text-primary", onClick: () => setShowTemplatePicker(true), href: undefined },
                { icon: "search", label: t("dashboard.check-cv"), desc: t("dashboard.check-cv-desc"), color: "bg-secondary-container/50", iconColor: "text-secondary", onClick: undefined, href: "/checker" },
                { icon: "grid_view", label: t("dashboard.portfolio"), desc: t("dashboard.portfolio-desc"), color: "bg-surface-container", iconColor: "text-primary", onClick: undefined, href: "/portfolio" },
                { icon: "record_voice_over", label: "Persiapan Interview", desc: "224+ pertanyaan umum untuk 28+ posisi", color: "bg-amber-50", iconColor: "text-amber-600", onClick: undefined, href: "/interview" },
              ].map((card, i) => {
                const content = (
                  <div className="bg-white rounded-2xl p-6 shadow-premium-md border border-outline-variant/50 hover:shadow-premium-lg hover:-translate-y-0.5 transition-[transform,box-shadow] duration-300 group active:scale-[0.98]">
                    <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <span className={`material-symbols-outlined ${card.iconColor} text-2xl`}>{card.icon}</span>
                    </div>
                    <h3 className="font-label-bold text-on-surface mb-1">{card.label}</h3>
                    <p className="text-body-md text-on-surface-variant">{card.desc}</p>
                  </div>
                );

                return (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.08 * i }}
                  >
                    {card.href ? (
                      <Link href={card.href}><MagneticButton className="w-full">{content}</MagneticButton></Link>
                    ) : (
                      <button onClick={card.onClick} className="w-full text-left"><MagneticButton className="w-full">{content}</MagneticButton></button>
                    )}
                  </motion.div>
                );
              })}
            </section>

            {/* Dashboard Stats */}
            <section className="mb-10">
              <DashboardStats totalCvs={stats.totalCvs} recentCount={stats.recentCount} completions={stats.completions} />
            </section>

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
              <section className="mb-8">
                <h2 className="font-headline-md text-on-surface mb-3">Aktivitas Terkini</h2>
                <div className="bg-white rounded-2xl p-4 shadow-premium-sm border border-outline-variant/50 space-y-2">
                  {recentActivity.map((cv, i) => (
                    <motion.div
                      key={cv.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container-low transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-on-surface truncate">
                          {cv.jobTitle ? `Membuat CV untuk "${cv.jobTitle}"` : "Membuat CV baru"}
                        </p>
                        <p className="text-[10px] text-on-surface-variant">{timeAgo(new Date(cv.updatedAt))}</p>
                      </div>
                      <button
                        onClick={() => router.push(`/builder/${cv.id}`)}
                        className="text-[10px] font-semibold text-primary hover:underline shrink-0"
                      >
                        Buka
                      </button>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Checker History ── */}
            {checkerHistoryLoading ? (
              <section className="mb-8">
                <h2 className="font-headline-md text-on-surface mb-3">Riwayat Analisis CV</h2>
                <div className="space-y-2">
                  {[1,2,3].map((i) => (
                    <div key={i} className="bg-white rounded-xl p-4 shadow-premium-sm border border-outline-variant/30 flex items-center gap-4 animate-pulse">
                      <div className="w-14 h-14 rounded-full bg-surface-container-high shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-surface-container-high rounded w-3/4" />
                        <div className="h-2 bg-surface-container-high rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : checkerHistory.length > 0 && (
              <section className="mb-8">
                <h2 className="font-headline-md text-on-surface mb-3">Riwayat Analisis CV</h2>
                <div className="space-y-2">
                  {checkerHistory.map((item, i) => {
                    const score = item.scores.overall;
                    const bgRing = score > 70 ? "bg-green-50 border-green-300" : score >= 40 ? "bg-amber-50 border-amber-300" : "bg-red-50 border-red-300";
                    const txtColor = score > 70 ? "text-green-700" : score >= 40 ? "text-amber-700" : "text-red-700";
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.03 }}
                        className="bg-white rounded-xl p-4 shadow-premium-sm border border-outline-variant/30 hover:shadow-premium-md hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4 cursor-pointer"
                        onClick={() => router.push(`/checker/${item.id}`)}
                      >
                        {/* Score ring — pakai threshold yang sama dengan ScoreDonut */}
                        <div className={`shrink-0 w-14 h-14 rounded-full flex items-center justify-center font-extrabold text-sm border-2 ${bgRing}`}>
                          <span className={txtColor}>{score}%</span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-on-surface truncate">
                            {item.aiFeedback.summary?.slice(0, 80) || "Analisis CV selesai"}
                          </p>
                          <p className="text-[10px] text-on-surface-variant mt-0.5">
                            {timeAgo(new Date(item.createdAt))}
                          </p>
                        </div>

                        {/* Arrow */}
                        <span className="material-symbols-outlined text-on-surface-variant text-sm shrink-0">chevron_right</span>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* CV History */}
            <section>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="font-headline-md text-on-surface">{t("dashboard.cv-history")}</h2>
                <div className="flex items-center gap-2">
                  {/* Search */}
                  <div className="relative">
                    <span className="material-symbols-outlined text-sm text-outline absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">search</span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari CV..."
                      className="w-36 md:w-48 pl-7 pr-2 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  {/* Filter status */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as "all" | "has-title" | "no-title")}
                    className="bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs px-2 py-1.5 focus:ring-1 focus:ring-primary"
                  >
                    <option value="all">Semua</option>
                    <option value="has-title">Sudah diisi</option>
                    <option value="no-title">Belum diisi</option>
                  </select>
                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "name-asc" | "name-desc")}
                    className="bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs px-2 py-1.5 focus:ring-1 focus:ring-primary"
                    title="Urutkan"
                  >
                    <option value="newest">Terbaru</option>
                    <option value="oldest">Terlama</option>
                    <option value="name-asc">A-Z</option>
                    <option value="name-desc">Z-A</option>
                  </select>
                  <MagneticButton>
                    <button
                      onClick={() => setShowTemplatePicker(true)}
                      className="text-label-bold text-primary hover:underline flex items-center gap-1 text-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      {t("dashboard.create-new")}
                    </button>
                  </MagneticButton>
                </div>
              </div>

              {searchQuery && filteredCvList.length === 0 && (
                <div className="bg-white rounded-2xl p-8 border border-dashed border-outline-variant text-center shadow-premium-sm mb-4">
                  <p className="text-sm text-on-surface-variant">Tidak ada CV dengan judul &ldquo;{searchQuery}&rdquo;</p>
                </div>
              )}

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl p-5 shadow-premium-sm border border-outline-variant/50 flex items-center justify-between gap-4 animate-pulse"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-surface-container-high rounded w-1/3" />
                        <div className="h-3 bg-surface-container-high rounded w-1/4" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-14 bg-surface-container-high rounded-xl" />
                        <div className="h-8 w-14 bg-surface-container-high rounded-xl" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : cvList.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="bg-white rounded-2xl p-12 border border-dashed border-outline-variant text-center shadow-premium-sm"
                >
                  <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-primary text-3xl">description</span>
                  </div>
                  <h3 className="font-label-bold text-on-surface mb-2">{t("dashboard.no-cv-title")}</h3>
                  <p className="text-body-md text-on-surface-variant mb-6">{t("dashboard.no-cv-desc")}</p>
                  <MagneticButton>
                    <button
                      onClick={() => setShowTemplatePicker(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-label-bold rounded-xl hover:opacity-90 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-lg">add</span>
                      {t("dashboard.first-cv")}
                    </button>
                  </MagneticButton>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {filteredCvList.map((cv) => (
                    <div
                      key={cv.id}
                      className="bg-white rounded-2xl p-5 shadow-premium-sm border border-outline-variant/50 flex items-center justify-between gap-4 hover:shadow-premium-md hover:-translate-y-0.5 transition-[transform,box-shadow] duration-300 group"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-label-bold text-on-surface truncate">{cv.jobTitle || t("dashboard.untitled-cv")}</h3>
                        <p className="text-label-sm text-on-surface-variant mt-0.5">
                          {CV_TEMPLATES.find(t => t.id === cv.templateId)?.name || "Template standar"} &middot; {new Date(cv.createdAt).toLocaleDateString("id-ID")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                    <MagneticButton>
                      <button
                        onClick={() => router.push(`/builder/${cv.id}`)}
                        className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-label-bold hover:bg-primary/20 active:scale-[0.97] transition-colors"
                      >
                        {t("dashboard.edit")}
                      </button>
                    </MagneticButton>
                    <MagneticButton>
                      <button
                        onClick={() => router.push(`/cv/${cv.id}/checkout`)}
                        className="px-3 py-2 rounded-xl bg-secondary/10 text-secondary text-label-bold hover:bg-secondary/20 active:scale-[0.97] transition-colors flex items-center gap-1"
                        title="Beli AI Revision untuk CV ini"
                      >
                        <span className="material-symbols-outlined text-sm">auto_awesome</span>
                        AI Rev
                      </button>
                    </MagneticButton>
                        <button
                          onClick={() => handleDelete(cv.id)}
                          className="p-2 rounded-xl text-error hover:bg-error-container/30 active:scale-[0.95] transition-colors"
                          aria-label="Hapus CV"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
        <AppFooter bordered />
        <TemplatePicker isOpen={showTemplatePicker} onClose={() => { if (!isCreating) setShowTemplatePicker(false); }} onSelect={handleCreateCV} isCreating={isCreating} />
        <ConfirmModal confirm={confirmAction} onClose={() => setConfirmAction(null)} />
      </div>
    </AuthGuard>
  );
}
