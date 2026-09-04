"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import AuthGuard from "@/components/AuthGuard";
import dynamic from "next/dynamic";
const TemplatePicker = dynamic(() => import("@/components/TemplatePicker"), { ssr: false });
import { CV_TEMPLATES } from "@/lib/templates";
import MagneticButton from "@/components/MagneticButton";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal, type ConfirmAction } from "@/components/ui/confirm-modal";
import { useTranslation } from "@/lib/i18n";

function timeAgo(date: Date, t: (k: string) => string, lang: string): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return t("dashboard.time-just-now");
  if (mins < 60) return t("dashboard.time-minutes").replace("{n}", String(mins));
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("dashboard.time-hours").replace("{n}", String(hours));
  const days = Math.floor(hours / 24);
  if (days < 7) return t("dashboard.time-days").replace("{n}", String(days));
  return date.toLocaleDateString(lang === "en" ? "en-US" : "id-ID");
}

interface CVItem {
  id: string;
  jobTitle: string | null;
  templateId: string;
  createdAt: string;
  updatedAt: string;
}

export default function MyResumesPage() {
  const { t, lang } = useTranslation();
  const { addToast } = useToast();
  const router = useRouter();
  const [cvList, setCvList] = useState<CVItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "has-title" | "no-title">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name-asc" | "name-desc">("newest");
  const [suratMenuFor, setSuratMenuFor] = useState<string | null>(null);
  const suratMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!suratMenuFor) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (suratMenuRef.current && !suratMenuRef.current.contains(target)) setSuratMenuFor(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSuratMenuFor(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [suratMenuFor]);

  useEffect(() => {
    fetch("/api/cv-documents")
      .then((res) => res.json())
      .then((data) => setCvList(Array.isArray(data) ? data : []))
      .catch(() => setCvList([]))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredCvList = useMemo(() => {
    let list = cvList;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((cv) => (cv.jobTitle || "").toLowerCase().includes(q));
    }
    if (filterStatus === "has-title") list = list.filter((cv) => !!cv.jobTitle);
    if (filterStatus === "no-title") list = list.filter((cv) => !cv.jobTitle);
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
      title: t("dashboard.delete-cv"),
      message: t("dashboard.confirm-delete"),
      variant: "danger",
      confirmLabel: t("dashboard.delete"),
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/cv-documents/${id}`, { method: "DELETE" });
          if (res.ok) {
            setCvList((prev) => prev.filter((cv) => cv.id !== id));
            addToast({ type: "success", message: t("dashboard.deleted-cv") });
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
            <section className="mb-8 flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="font-headline-lg text-on-background mb-1">My Resumes</h1>
                <p className="font-body-md text-on-surface-variant">
                  {t("myresumes.subtitle")}
                </p>
              </div>
              <MagneticButton>
                <button
                  onClick={() => setShowTemplatePicker(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  <span className="material-symbols-outlined text-base select-none">add</span>
                  {t("dashboard.create-new")}
                </button>
              </MagneticButton>
            </section>

            {/* Toolbar: search + filter + sort */}
            <section className="mb-6 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="material-symbols-outlined text-sm text-outline absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none select-none">search</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("dashboard.search-cv")}
                    className="w-36 md:w-48 pl-7 pr-2 py-1.5 rounded-lg bg-white border border-outline-variant/30 text-xs shadow-premium-sm focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as "all" | "has-title" | "no-title")}
                  className="bg-white border border-outline-variant/30 rounded-lg text-xs px-2 py-1.5 shadow-premium-sm focus:ring-1 focus:ring-primary"
                >
                  <option value="all">{t("dashboard.all")}</option>
                  <option value="has-title">{t("dashboard.has-title")}</option>
                  <option value="no-title">{t("dashboard.no-title")}</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "name-asc" | "name-desc")}
                  className="bg-white border border-outline-variant/30 rounded-lg text-xs px-2 py-1.5 shadow-premium-sm focus:ring-1 focus:ring-primary"
                  title={t("dashboard.sort")}
                >
                  <option value="newest">{t("dashboard.newest")}</option>
                  <option value="oldest">{t("dashboard.oldest")}</option>
                  <option value="name-asc">A-Z</option>
                  <option value="name-desc">Z-A</option>
                </select>
              </div>
              {cvList.length > 0 && (
                <span className="text-xs font-semibold text-on-surface-variant">
                  {t("dashboard.count-of").replace("{n1}", String(filteredCvList.length)).replace("{n2}", String(cvList.length))}
                </span>
              )}
            </section>

            {searchQuery && filteredCvList.length === 0 && (
              <div className="bg-white rounded-2xl p-8 border border-dashed border-outline-variant text-center shadow-premium-sm mb-4">
                <p className="text-sm text-on-surface-variant">{t("dashboard.no-search-result").replace("{q}", searchQuery)}</p>
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
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-white rounded-2xl p-12 border border-dashed border-outline-variant text-center shadow-premium-sm"
              >
                <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-primary text-3xl select-none">description</span>
                </div>
                <h3 className="font-label-bold text-on-surface mb-2">{t("dashboard.no-cv-title")}</h3>
                <p className="text-body-md text-on-surface-variant mb-6">{t("dashboard.no-cv-desc")}</p>
                <MagneticButton>
                  <button
                    onClick={() => setShowTemplatePicker(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-label-bold rounded-xl hover:opacity-90 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-lg select-none">add</span>
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
                        {CV_TEMPLATES.find((tmpl) => tmpl.id === cv.templateId)?.name || t("dashboard.template-default")} &middot; {new Date(cv.createdAt).toLocaleDateString(lang === "en" ? "en-US" : "id-ID")} &middot; {t("dashboard.updated-at").replace("{time}", timeAgo(new Date(cv.updatedAt), t, lang))}
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
                      <div className="relative" ref={suratMenuRef}>
                        <MagneticButton>
                          <button
                            onClick={() => setSuratMenuFor(suratMenuFor === cv.id ? null : cv.id)}
                            aria-haspopup="menu"
                            aria-expanded={suratMenuFor === cv.id}
                            className={`px-3 py-2 rounded-xl text-label-bold active:scale-[0.97] transition-colors flex items-center gap-1 ${suratMenuFor === cv.id ? "bg-violet-100 text-violet-800" : "bg-violet-50 text-violet-700 hover:bg-violet-100"}`}
                            title={t("dashboard.surat-title")}
                          >
                            <span className="material-symbols-outlined text-sm select-none">mail</span>
                            {t("dashboard.letters")}
                            <span className={`material-symbols-outlined text-[14px] transition-transform select-none ${suratMenuFor === cv.id ? "rotate-180" : ""}`}>arrow_drop_down</span>
                          </button>
                        </MagneticButton>
                        <AnimatePresence>
                          {suratMenuFor === cv.id && (
                            <motion.div
                              key="surat-menu"
                              initial={{ opacity: 0, y: -6, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -6, scale: 0.98 }}
                              transition={{ duration: 0.15 }}
                              role="menu"
                              className="absolute right-0 top-full mt-1 z-30 w-60 bg-white rounded-xl shadow-premium-lg border border-outline-variant/50 overflow-hidden py-1.5"
                            >
                              <p className="px-4 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{t("dashboard.create-letter-from-cv")}</p>
                              <button
                                role="menuitem"
                                onClick={() => { setSuratMenuFor(null); router.push(`/surat-lamaran/${cv.id}?style=formal`); }}
                                className="w-full flex items-start gap-2.5 px-4 py-2.5 text-left hover:bg-surface-container-low transition-colors"
                              >
                                <span className="material-symbols-outlined text-violet-600 text-lg mt-0.5 select-none" style={{ fontVariationSettings: "'FILL' 1" }}>markunread_mailbox</span>
                                <span>
                                  <span className="block text-xs font-bold text-on-surface">{t("dashboard.application-letter")}</span>
                                  <span className="block text-[10px] text-on-surface-variant">{t("dashboard.styles-hint")}</span>
                                </span>
                              </button>
                              <button
                                role="menuitem"
                                onClick={() => { setSuratMenuFor(null); router.push(`/surat-lamaran/${cv.id}?style=motivation`); }}
                                className="w-full flex items-start gap-2.5 px-4 py-2.5 text-left hover:bg-surface-container-low transition-colors"
                              >
                                <span className="material-symbols-outlined text-amber-600 text-lg mt-0.5 select-none" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                                <span>
                                  <span className="block text-xs font-bold text-on-surface">{t("dashboard.motivation-letter")}</span>
                                  <span className="block text-[10px] text-on-surface-variant">{t("dashboard.motivation-hint")}</span>
                                </span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <MagneticButton>
                        <button
                          onClick={() => router.push(`/cv/${cv.id}/checkout`)}
                          className="px-3 py-2 rounded-xl bg-secondary/10 text-secondary text-label-bold hover:bg-secondary/20 active:scale-[0.97] transition-colors flex items-center gap-1"
                          title={t("dashboard.ai-rev-title")}
                        >
                          <span className="material-symbols-outlined text-sm select-none">auto_awesome</span>
                          AI Rev
                        </button>
                      </MagneticButton>
                      <button
                        onClick={() => handleDelete(cv.id)}
                        className="p-2 rounded-xl text-error hover:bg-error-container/30 active:scale-[0.95] transition-colors"
                        aria-label={t("dashboard.delete-cv-aria")}
                      >
                        <span className="material-symbols-outlined text-lg select-none">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
        <AppFooter bordered />
        <TemplatePicker isOpen={showTemplatePicker} onClose={() => { if (!isCreating) setShowTemplatePicker(false); }} onSelect={handleCreateCV} isCreating={isCreating} />
        <ConfirmModal confirm={confirmAction} onClose={() => setConfirmAction(null)} />
      </div>
    </AuthGuard>
  );
}
