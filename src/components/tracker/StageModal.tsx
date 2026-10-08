"use client";

import { useMemo, useState } from "react";
import Modal from "@/components/Modal";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n";
import { STAGE_COLORS, type StageColor } from "@/lib/tracker";
import type { Stage, TrackedJob } from "./types";
import { stageColorClasses } from "./stageColors";

interface StageModalProps {
  open: boolean;
  stages: Stage[];
  jobs: TrackedJob[];
  onClose: () => void;
  onChanged: () => void;
}

const inputClass =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

export function StageModal({ open, stages, jobs, onClose, onChanged }: StageModalProps) {
  const { t } = useTranslation();
  const { addToast } = useToast();

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<StageColor>("teal");
  const [busyStageId, setBusyStageId] = useState<string | null>(null);
  const [colorPickerFor, setColorPickerFor] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Stage | null>(null);
  const [deleteMoveTo, setDeleteMoveTo] = useState("");

  const jobCountByStage = useMemo(() => {
    const counts = new Map<string, number>();
    for (const job of jobs) {
      counts.set(job.stageId, (counts.get(job.stageId) ?? 0) + 1);
    }
    return counts;
  }, [jobs]);

  const otherStages = useMemo(
    () => (deleteTarget ? stages.filter((stage) => stage.id !== deleteTarget.id) : []),
    [stages, deleteTarget],
  );

  const runAction = async (stageId: string | null, action: () => Promise<Response>, successKey: string) => {
    setBusyStageId(stageId);
    try {
      const response = await action();
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        addToast({ type: "error", message: data?.message || t("tracker.toast.error") });
        return false;
      }
      addToast({ type: "success", message: t(successKey) });
      onChanged();
      return true;
    } catch {
      addToast({ type: "error", message: t("tracker.toast.error") });
      return false;
    } finally {
      setBusyStageId(null);
    }
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    const ok = await runAction(
      null,
      () =>
        fetch("/api/tracker/stages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, color: newColor }),
        }),
      "tracker.toast.stage-saved",
    );
    if (ok) {
      setNewName("");
    }
  };

  const handleRename = async (stage: Stage, name: string) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === stage.name) return;
    await runAction(
      stage.id,
      () =>
        fetch(`/api/tracker/stages/${stage.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        }),
      "tracker.toast.stage-saved",
    );
  };

  const handleColor = async (stage: Stage, color: StageColor) => {
    setColorPickerFor(null);
    if (color === stage.color) return;
    await runAction(
      stage.id,
      () =>
        fetch(`/api/tracker/stages/${stage.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ color }),
        }),
      "tracker.toast.stage-saved",
    );
  };

  const handleMove = async (stage: Stage, direction: -1 | 1) => {
    const index = stages.findIndex((candidate) => candidate.id === stage.id);
    const neighbor = stages[index + direction];
    if (!neighbor) return;
    const stageOrder = stage.sortOrder;
    const neighborOrder = neighbor.sortOrder;
    await runAction(
      stage.id,
      async () => {
        const first = await fetch(`/api/tracker/stages/${stage.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: neighborOrder }),
        });
        if (!first.ok) return first;
        return fetch(`/api/tracker/stages/${neighbor.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: stageOrder }),
        });
      },
      "tracker.toast.stage-saved",
    );
  };

  const requestDelete = (stage: Stage) => {
    setDeleteTarget(stage);
    setDeleteMoveTo(otherStages[0]?.id ?? "");
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const count = jobCountByStage.get(deleteTarget.id) ?? 0;
    const ok = await runAction(
      deleteTarget.id,
      () =>
        fetch(`/api/tracker/stages/${deleteTarget.id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(count > 0 ? { moveTo: deleteMoveTo } : {}),
        }),
      "tracker.toast.stage-deleted",
    );
    if (ok) {
      setDeleteTarget(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t("tracker.stages.title")} size="max-w-lg">
      <div className="space-y-4">
        <p className="text-label-sm text-on-surface-variant">{t("tracker.stages.hint")}</p>

        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {stages.map((stage, index) => {
            const count = jobCountByStage.get(stage.id) ?? 0;
            const busy = busyStageId === stage.id;
            const isDeleting = deleteTarget?.id === stage.id;
            return (
              <div key={stage.id} className="rounded-xl border border-outline-variant/70 p-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setColorPickerFor(colorPickerFor === stage.id ? null : stage.id)}
                    aria-label={t("tracker.stages.color")}
                    className={`h-7 w-7 shrink-0 rounded-full ${stageColorClasses(stage.color).dot} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40`}
                  />
                  <input
                    className={`${inputClass} flex-1`}
                    defaultValue={stage.name}
                    onBlur={(event) => handleRename(stage, event.target.value)}
                    maxLength={60}
                    disabled={busy}
                    aria-label={t("tracker.stages.name")}
                  />
                  <span className="shrink-0 rounded-full bg-surface-container px-2 py-0.5 text-label-sm text-on-surface-variant">
                    {count}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleMove(stage, -1)}
                    disabled={index === 0 || busy}
                    aria-label={t("tracker.stages.move-up")}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden>
                      arrow_upward
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(stage, 1)}
                    disabled={index === stages.length - 1 || busy}
                    aria-label={t("tracker.stages.move-down")}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden>
                      arrow_downward
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => requestDelete(stage)}
                    disabled={stages.length <= 1 || busy}
                    aria-label={t("tracker.stages.delete")}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-error hover:bg-error-container/40 disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden>
                      delete
                    </span>
                  </button>
                </div>

                {colorPickerFor === stage.id ? (
                  <div className="mt-2 flex flex-wrap gap-1.5 pl-9">
                    {STAGE_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleColor(stage, color)}
                        aria-label={color}
                        className={`h-6 w-6 rounded-full ${stageColorClasses(color).dot} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                          color === stage.color ? "ring-2 ring-on-surface/40" : ""
                        }`}
                      />
                    ))}
                  </div>
                ) : null}

                {isDeleting ? (
                  <div className="mt-2 space-y-2 rounded-lg bg-surface-container-low p-3">
                    <p className="text-label-bold text-on-surface">
                      {count > 0 ? t("tracker.stages.delete-with-jobs") : t("tracker.stages.confirm-delete")}
                    </p>
                    {count > 0 ? (
                      <select
                        className={inputClass}
                        value={deleteMoveTo}
                        onChange={(event) => setDeleteMoveTo(event.target.value)}
                      >
                        {otherStages.map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>
                            {candidate.name}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(null)}
                        className="rounded-lg px-3 py-1.5 text-label-bold text-on-surface-variant hover:bg-surface-container"
                      >
                        {t("tracker.form.cancel")}
                      </button>
                      <button
                        type="button"
                        onClick={confirmDelete}
                        disabled={busy || (count > 0 && !deleteMoveTo)}
                        className="rounded-lg bg-error px-3 py-1.5 text-label-bold text-on-error hover:opacity-90 disabled:opacity-50"
                      >
                        {t("tracker.card.delete")}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 border-t border-outline-variant/60 pt-3">
          <input
            className={`${inputClass} flex-1`}
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder={t("tracker.stages.new-placeholder")}
            maxLength={60}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleAdd();
              }
            }}
          />
          <div className="flex items-center gap-1.5">
            {STAGE_COLORS.slice(0, 5).map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setNewColor(color)}
                aria-label={color}
                className={`h-6 w-6 rounded-full ${stageColorClasses(color).dot} ${
                  color === newColor ? "ring-2 ring-on-surface/40" : ""
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newName.trim() || busyStageId !== null}
            className="rounded-lg bg-primary px-4 py-2.5 text-label-bold text-on-primary hover:opacity-90 disabled:opacity-50"
          >
            {t("tracker.stages.add")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
