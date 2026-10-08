"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useTranslation } from "@/lib/i18n";
import type { Stage, TrackedJob } from "./types";
import { stageColorClasses } from "./stageColors";
import { SortableJobCard } from "./JobCard";

interface TrackerColumnProps {
  stage: Stage;
  jobs: TrackedJob[];
  stages: Stage[];
  cvMap: Map<string, string>;
  letterMap: Map<string, string>;
  onAddJob: (stageId: string) => void;
  onEditJob: (job: TrackedJob) => void;
  onDeleteJob: (job: TrackedJob) => void;
  onMoveJob: (job: TrackedJob, stageId: string) => void;
  onManageStages: () => void;
}

export function TrackerColumn({
  stage,
  jobs,
  stages,
  cvMap,
  letterMap,
  onAddJob,
  onEditJob,
  onDeleteJob,
  onMoveJob,
  onManageStages,
}: TrackerColumnProps) {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({ id: `stage:${stage.id}` });
  const colors = stageColorClasses(stage.color);

  return (
    <section className="flex w-72 shrink-0 flex-col rounded-2xl bg-surface-container-low">
      <header className="flex items-center gap-2 px-3 pb-2 pt-3">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${colors.dot}`} aria-hidden />
        <button
          type="button"
          onClick={onManageStages}
          title={t("tracker.manage-stages")}
          className="min-w-0 flex-1 truncate text-left text-label-bold text-on-surface hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {stage.name}
        </button>
        <span className="rounded-full bg-surface-container px-2 py-0.5 text-label-sm text-on-surface-variant">
          {jobs.length}
        </span>
        <button
          type="button"
          onClick={() => onAddJob(stage.id)}
          aria-label={t("tracker.column.add")}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden>
            add
          </span>
        </button>
      </header>

      <div
        ref={setNodeRef}
        className={`min-h-[140px] flex-1 space-y-2 rounded-b-2xl px-2 pb-3 transition-colors ${
          isOver ? colors.soft : ""
        }`}
      >
        <SortableContext items={jobs.map((job) => job.id)} strategy={verticalListSortingStrategy}>
          {jobs.map((job) => (
            <SortableJobCard
              key={job.id}
              job={job}
              stage={stage}
              stages={stages}
              cvLabel={job.cvId ? cvMap.get(job.cvId) : undefined}
              letterLabel={job.coverLetterId ? letterMap.get(job.coverLetterId) : undefined}
              onEdit={onEditJob}
              onDelete={onDeleteJob}
              onMove={onMoveJob}
            />
          ))}
        </SortableContext>

        {jobs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-outline-variant px-3 py-6 text-center text-label-sm text-on-surface-variant">
            {t("tracker.column.empty")}
          </p>
        ) : null}
      </div>
    </section>
  );
}
