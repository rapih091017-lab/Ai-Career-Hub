"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import AppHeader from "@/components/AppHeader";
import AuthGuard from "@/components/AuthGuard";
import { ConfirmModal, type ConfirmAction } from "@/components/ui/confirm-modal";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n";
import { POSITION_GAP } from "@/lib/tracker";
import { JobCardContent } from "@/components/tracker/JobCard";
import { JobModal } from "@/components/tracker/JobModal";
import { StageModal } from "@/components/tracker/StageModal";
import { TrackerColumn } from "@/components/tracker/TrackerColumn";
import { stageColorClasses } from "@/components/tracker/stageColors";
import type { CvOption, LetterOption, Stage, TrackedJob } from "@/components/tracker/types";

export default function TrackerPage() {
  const { t } = useTranslation();
  const { addToast } = useToast();

  const [stages, setStages] = useState<Stage[]>([]);
  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  const [cvOptions, setCvOptions] = useState<CvOption[]>([]);
  const [letterOptions, setLetterOptions] = useState<LetterOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobModal, setJobModal] = useState<{
    open: boolean;
    job: TrackedJob | null;
    defaultStageId: string | null;
  }>({ open: false, job: null, defaultStageId: null });
  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [stagesRes, jobsRes, cvRes, lettersRes] = await Promise.all([
        fetch("/api/tracker/stages"),
        fetch("/api/tracker/jobs"),
        fetch("/api/cv-documents"),
        fetch("/api/cover-letter"),
      ]);
      if (!stagesRes.ok || !jobsRes.ok) throw new Error("gateway");

      const stagesData = await stagesRes.json();
      const jobsData = await jobsRes.json();
      setStages(stagesData.stages ?? []);
      setJobs(jobsData.jobs ?? []);

      if (cvRes.ok) {
        const cvs = await cvRes.json();
        setCvOptions(Array.isArray(cvs) ? cvs : []);
      }
      if (lettersRes.ok) {
        const letters = await lettersRes.json();
        setLetterOptions(Array.isArray(letters) ? letters : []);
      }
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const cvMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cv of cvOptions) map.set(cv.id, cv.jobTitle);
    return map;
  }, [cvOptions]);

  const letterMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const letter of letterOptions) {
      const label = letter.jobTitle || letter.companyName;
      if (label) map.set(letter.id, label);
    }
    return map;
  }, [letterOptions]);

  const jobsByStage = useMemo(() => {
    const query = search.trim().toLowerCase();
    const visible = query
      ? jobs.filter(
          (job) =>
            job.title.toLowerCase().includes(query) ||
            (job.company ?? "").toLowerCase().includes(query),
        )
      : jobs;

    const map = new Map<string, TrackedJob[]>();
    for (const stage of stages) map.set(stage.id, []);
    for (const job of visible) {
      const bucket = map.get(job.stageId) ?? (stages[0] ? map.get(stages[0].id) : undefined);
      bucket?.push(job);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.position - b.position);
    }
    return map;
  }, [stages, jobs, search]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const openAddJob = (stageId?: string) => {
    setJobModal({ open: true, job: null, defaultStageId: stageId ?? stages[0]?.id ?? null });
  };

  const openEditJob = (job: TrackedJob) => {
    setJobModal({ open: true, job, defaultStageId: null });
  };

  const requestDeleteJob = (job: TrackedJob) => {
    setConfirm({
      title: t("tracker.delete-title"),
      message: job.company ? `${job.title} (${job.company})` : job.title,
      confirmLabel: t("tracker.card.delete"),
      cancelLabel: t("tracker.form.cancel"),
      variant: "danger",
      onConfirm: async () => {
        setConfirm(null);
        try {
          const response = await fetch(`/api/tracker/jobs/${job.id}`, { method: "DELETE" });
          if (!response.ok) throw new Error("delete failed");
          setJobs((prev) => prev.filter((item) => item.id !== job.id));
          addToast({ type: "success", message: t("tracker.toast.deleted") });
        } catch {
          addToast({ type: "error", message: t("tracker.toast.error") });
        }
      },
      onCancel: () => setConfirm(null),
    });
  };

  const handleMoveJob = async (job: TrackedJob, stageId: string) => {
    const lastPosition = jobs
      .filter((item) => item.stageId === stageId)
      .reduce((max, item) => Math.max(max, item.position), 0);
    const newPosition = lastPosition + POSITION_GAP;

    setJobs((prev) =>
      prev.map((item) => (item.id === job.id ? { ...item, stageId, position: newPosition } : item)),
    );

    try {
      const response = await fetch(`/api/tracker/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId }),
      });
      if (!response.ok) throw new Error("move failed");
      addToast({ type: "success", message: t("tracker.toast.moved") });
    } catch {
      addToast({ type: "error", message: t("tracker.toast.error") });
      loadAll();
    }
  };

  const resolveStageId = (overId: string, list: TrackedJob[]): string | null => {
    if (overId.startsWith("stage:")) return overId.slice(6);
    return list.find((job) => job.id === overId)?.stageId ?? null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveJobId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overStageId = resolveStageId(String(over.id), jobs);
    if (!overStageId) return;

    setJobs((prev) => {
      const activeJob = prev.find((job) => job.id === activeId);
      if (!activeJob || activeJob.stageId === overStageId) return prev;
      return prev.map((job) => (job.id === activeId ? { ...job, stageId: overStageId } : job));
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveJobId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeJob = jobs.find((job) => job.id === activeId);
    if (!activeJob) return;

    const overJob = jobs.find((job) => job.id === overId);
    const overStageId = overJob
      ? overJob.stageId
      : overId.startsWith("stage:")
        ? overId.slice(6)
        : activeJob.stageId;

    const column = jobs
      .filter((job) => job.stageId === overStageId && job.id !== activeId)
      .sort((a, b) => a.position - b.position);

    let newPosition: number;
    if (overJob && overJob.id !== activeId) {
      const index = column.findIndex((job) => job.id === overJob.id);
      // Drop di item: hasilnya sebelum item itu, kecuali saat bergerak turun
      // dalam kolom yang sama, hasilnya setelah item (perilaku kanban umum).
      const movingDown = activeJob.stageId === overStageId && activeJob.position < overJob.position;
      if (movingDown) {
        const after = column[index + 1];
        const anchor = after ? after.position : overJob.position + POSITION_GAP;
        newPosition = Math.round((overJob.position + anchor) / 2);
      } else {
        const before = column[index - 1];
        const anchor = before ? before.position : overJob.position - POSITION_GAP;
        newPosition = Math.round((anchor + overJob.position) / 2);
      }
    } else {
      const last = column[column.length - 1];
      newPosition = last ? last.position + POSITION_GAP : POSITION_GAP;
    }

    if (activeJob.stageId === overStageId && activeJob.position === newPosition) return;

    setJobs((prev) =>
      prev.map((job) =>
        job.id === activeId ? { ...job, stageId: overStageId, position: newPosition } : job,
      ),
    );

    void (async () => {
      try {
        const response = await fetch(`/api/tracker/jobs/${activeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stageId: overStageId, position: newPosition }),
        });
        if (!response.ok) throw new Error("move failed");
      } catch {
        addToast({ type: "error", message: t("tracker.toast.error") });
        loadAll();
      }
    })();
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background text-on-background">
        <AppHeader />

        <main className="mx-auto max-w-[1400px] px-margin-mobile pb-24 pt-24 md:px-gutter">
          <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-headline-lg font-headline-lg text-on-background">{t("tracker.title")}</h1>
              <p className="mt-1 max-w-[560px] text-body-md text-on-surface-variant">{t("tracker.subtitle")}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <span
                  className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant"
                  aria-hidden
                >
                  search
                </span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t("tracker.search-placeholder")}
                  className="h-11 w-full rounded-xl border border-outline-variant bg-surface-container-lowest pl-10 pr-3 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 md:w-64"
                />
              </div>
              <button
                type="button"
                onClick={() => setStageModalOpen(true)}
                className="h-11 rounded-xl border border-outline-variant px-4 text-label-bold text-on-surface transition-colors hover:bg-surface-container"
              >
                {t("tracker.manage-stages")}
              </button>
              <button
                type="button"
                onClick={() => openAddJob()}
                className="h-11 rounded-xl bg-primary px-4 text-label-bold text-on-primary transition-opacity hover:opacity-90"
              >
                {t("tracker.add-job")}
              </button>
            </div>
          </section>

          {isLoading ? (
            <div className="space-y-4" aria-busy="true">
              <div className="h-64 animate-pulse rounded-2xl bg-surface-container-low" />
              <div className="h-64 animate-pulse rounded-2xl bg-surface-container-low md:hidden" />
            </div>
          ) : loadError ? (
            <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-8 text-center">
              <p className="text-body-md text-on-surface-variant">{t("tracker.error-load")}</p>
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  loadAll();
                }}
                className="mt-4 rounded-xl bg-primary px-4 py-2.5 text-label-bold text-on-primary hover:opacity-90"
              >
                {t("tracker.retry")}
              </button>
            </div>
          ) : (
            <>
              {/* Board desktop: kolom bisa digeser horizontal, ukuran tetap per kolom. */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={() => {
                  setActiveJobId(null);
                  loadAll();
                }}
              >
                <div
                  className={`hidden gap-4 overflow-x-auto pb-4 md:flex ${
                    activeJobId ? "cursor-grabbing select-none" : ""
                  }`}
                >
                  {stages.map((stage) => (
                    <TrackerColumn
                      key={stage.id}
                      stage={stage}
                      jobs={jobsByStage.get(stage.id) ?? []}
                      stages={stages}
                      cvMap={cvMap}
                      letterMap={letterMap}
                      onAddJob={openAddJob}
                      onEditJob={openEditJob}
                      onDeleteJob={requestDeleteJob}
                      onMoveJob={handleMoveJob}
                      onManageStages={() => setStageModalOpen(true)}
                    />
                  ))}
                </div>
              </DndContext>

              {/* Mobile: daftar per tahap, tanpa drag, aksi lewat menu kartu. */}
              <div className="space-y-6 md:hidden">
                {stages.map((stage) => {
                  const list = jobsByStage.get(stage.id) ?? [];
                  return (
                    <section key={stage.id}>
                      <header className="mb-2 flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${stageColorClasses(stage.color).dot}`}
                          aria-hidden
                        />
                        <h2 className="text-label-bold text-on-surface">{stage.name}</h2>
                        <span className="text-label-sm text-on-surface-variant">{list.length}</span>
                        <button
                          type="button"
                          onClick={() => openAddJob(stage.id)}
                          aria-label={t("tracker.column.add")}
                          className="ml-auto flex h-11 w-11 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container"
                        >
                          <span className="material-symbols-outlined text-[20px]" aria-hidden>
                            add
                          </span>
                        </button>
                      </header>
                      <div className="space-y-2">
                        {list.map((job) => (
                          <JobCardContent
                            key={job.id}
                            job={job}
                            stage={stage}
                            stages={stages}
                            cvLabel={job.cvId ? cvMap.get(job.cvId) : undefined}
                            letterLabel={job.coverLetterId ? letterMap.get(job.coverLetterId) : undefined}
                            onEdit={openEditJob}
                            onDelete={requestDeleteJob}
                            onMove={handleMoveJob}
                            onCardClick={() => openEditJob(job)}
                          />
                        ))}
                        {list.length === 0 ? (
                          <p className="rounded-xl border border-dashed border-outline-variant px-3 py-4 text-center text-label-sm text-on-surface-variant">
                            {t("tracker.column.empty")}
                          </p>
                        ) : null}
                      </div>
                    </section>
                  );
                })}
              </div>
            </>
          )}
        </main>

        <JobModal
          open={jobModal.open}
          job={jobModal.job}
          defaultStageId={jobModal.defaultStageId}
          stages={stages}
          cvOptions={cvOptions}
          letterOptions={letterOptions}
          onClose={() => setJobModal({ open: false, job: null, defaultStageId: null })}
          onSaved={loadAll}
        />
        <StageModal
          open={stageModalOpen}
          stages={stages}
          jobs={jobs}
          onClose={() => setStageModalOpen(false)}
          onChanged={loadAll}
        />
        <ConfirmModal confirm={confirm} onClose={() => setConfirm(null)} />
      </div>
    </AuthGuard>
  );
}
