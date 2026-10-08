"use client";

import { useEffect, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "@/lib/i18n";
import type { Stage, TrackedJob } from "./types";

interface JobCardProps {
  job: TrackedJob;
  stage: Stage;
  stages: Stage[];
  cvLabel?: string;
  letterLabel?: string;
  onEdit: (job: TrackedJob) => void;
  onDelete: (job: TrackedJob) => void;
  onMove: (job: TrackedJob, stageId: string) => void;
}

interface JobCardContentProps extends JobCardProps {
  isDragging?: boolean;
  onCardClick?: () => void;
  /** Handle keyboard untuk drag (dnd-kit attributes + onKeyDown). */
  dragHandle?: {
    attributes: Record<string, unknown>;
    onKeyDown?: (event: React.KeyboardEvent) => void;
  };
}

function formatShortDate(iso: string | null, lang: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(lang === "en" ? "en-GB" : "id-ID", {
    day: "numeric",
    month: "short",
  });
}

function Chip({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-surface-container px-2 py-0.5 text-label-sm text-on-surface-variant">
      <span className="material-symbols-outlined text-[13px]" aria-hidden>
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </span>
  );
}

/** Kartu lowongan versi presentasional. Dipakai board (dibungkus sortable)
 * dan daftar mobile (langsung), supaya konten & menu hanya ditulis sekali. */
export function JobCardContent({
  job,
  stage,
  stages,
  cvLabel,
  letterLabel,
  onEdit,
  onDelete,
  onMove,
  isDragging = false,
  onCardClick,
  dragHandle,
}: JobCardContentProps) {
  const { t, lang } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointer = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  const appliedLabel = formatShortDate(job.appliedAt, lang);
  const moveTargets = stages.filter((candidate) => candidate.id !== stage.id);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest("[data-card-menu]")) return;
        onCardClick?.();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !(event.target instanceof HTMLButtonElement)) {
          onCardClick?.();
        }
      }}
      className={`group relative rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-3 text-left shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
        isDragging ? "opacity-60 shadow-lg ring-2 ring-primary/30" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-body-md font-semibold text-on-surface">{job.title}</p>
          {job.company ? (
            <p className="mt-0.5 truncate text-label-sm text-on-surface-variant">{job.company}</p>
          ) : null}
        </div>

        {dragHandle ? (
          <button
            type="button"
            data-card-menu
            {...dragHandle.attributes}
            onKeyDown={dragHandle.onKeyDown}
            aria-label={t("tracker.card.drag")}
            className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-lg text-on-surface-variant/70 hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:cursor-grabbing"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden>
              drag_indicator
            </span>
          </button>
        ) : null}

        <div className="relative" data-card-menu ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={t("tracker.card.menu")}
            aria-expanded={menuOpen}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-on-surface-variant/70 hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden>
              more_vert
            </span>
          </button>

          {menuOpen ? (
            <div className="absolute right-0 top-full z-30 mt-1 w-48 rounded-xl border border-outline-variant/70 bg-surface-container-lowest py-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(job);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-label-bold text-on-surface hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden>
                  edit
                </span>
                {t("tracker.card.edit")}
              </button>
              {job.url ? (
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-label-bold text-on-surface hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[16px]" aria-hidden>
                    open_in_new
                  </span>
                  {t("tracker.card.open-link")}
                </a>
              ) : null}

              {moveTargets.length > 0 ? (
                <>
                  <p className="px-3 pb-1 pt-2 text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant/70">
                    {t("tracker.card.move-to")}
                  </p>
                  <div className="max-h-40 overflow-y-auto">
                    {moveTargets.map((target) => (
                      <button
                        key={target.id}
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onMove(job, target.id);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-label-bold text-on-surface hover:bg-surface-container"
                      >
                        <span className="h-2 w-2 shrink-0 rounded-full bg-current opacity-60" aria-hidden />
                        <span className="truncate">{target.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              <div className="my-1 border-t border-outline-variant/60" />
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(job);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-label-bold text-error hover:bg-error-container/40"
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden>
                  delete
                </span>
                {t("tracker.card.delete")}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {job.location || appliedLabel || cvLabel || letterLabel ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {job.location ? <Chip icon="place" label={job.location} /> : null}
          {appliedLabel ? <Chip icon="event" label={appliedLabel} /> : null}
          {cvLabel ? <Chip icon="description" label={cvLabel} /> : null}
          {letterLabel ? <Chip icon="mail" label={letterLabel} /> : null}
        </div>
      ) : null}
    </div>
  );
}

/** Versi sortable untuk board desktop. Drag dari mana saja di kartu
 * (pointer/touch); drag via keyboard lewat handle khusus di kanan atas agar
 * Enter/Space pada kartu tetap dipakai untuk membuka edit. */
export function SortableJobCard(props: JobCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.job.id,
  });
  const lastDragEnd = useRef(0);

  useEffect(() => {
    if (!isDragging) lastDragEnd.current = Date.now();
  }, [isDragging]);

  const { onKeyDown, ...pointerListeners } = listeners ?? {};

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...pointerListeners}
      onClickCapture={(event) => {
        // Klik yang datang segera setelah drop adalah sisa event drag, bukan niat user.
        if (Date.now() - lastDragEnd.current < 250) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <JobCardContent
        {...props}
        isDragging={isDragging}
        onCardClick={() => props.onEdit(props.job)}
        dragHandle={{
          attributes: attributes as unknown as Record<string, unknown>,
          onKeyDown: onKeyDown as unknown as (event: React.KeyboardEvent) => void,
        }}
      />
    </div>
  );
}
