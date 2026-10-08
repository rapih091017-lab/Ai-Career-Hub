"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n";
import type { CvOption, LetterOption, Stage, TrackedJob } from "./types";

interface JobModalProps {
  open: boolean;
  /** null = tambah baru; TrackedJob = edit */
  job: TrackedJob | null;
  defaultStageId: string | null;
  stages: Stage[];
  cvOptions: CvOption[];
  letterOptions: LetterOption[];
  onClose: () => void;
  onSaved: () => void;
}

const inputClass =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-label-bold text-on-surface">{label}</span>
      {children}
    </label>
  );
}

export function JobModal({
  open,
  job,
  defaultStageId,
  stages,
  cvOptions,
  letterOptions,
  onClose,
  onSaved,
}: JobModalProps) {
  const { t } = useTranslation();
  const { addToast } = useToast();

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [url, setUrl] = useState("");
  const [salaryNote, setSalaryNote] = useState("");
  const [stageId, setStageId] = useState("");
  const [appliedAt, setAppliedAt] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [cvId, setCvId] = useState("");
  const [coverLetterId, setCoverLetterId] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(job?.title ?? "");
    setCompany(job?.company ?? "");
    setLocation(job?.location ?? "");
    setUrl(job?.url ?? "");
    setSalaryNote(job?.salaryNote ?? "");
    setStageId(job?.stageId ?? defaultStageId ?? stages[0]?.id ?? "");
    setAppliedAt(job?.appliedAt ? job.appliedAt.slice(0, 10) : "");
    setContactName(job?.contactName ?? "");
    setContactInfo(job?.contactInfo ?? "");
    setCvId(job?.cvId ?? "");
    setCoverLetterId(job?.coverLetterId ?? "");
    setDescription(job?.description ?? "");
    setNotes(job?.notes ?? "");
    setError(null);
    setSaving(false);
  }, [open, job, defaultStageId, stages]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError(t("tracker.form.title-required"));
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      title: trimmedTitle,
      company,
      location,
      url,
      salaryNote,
      contactName,
      contactInfo,
      notes,
      description,
      stageId: stageId || undefined,
      appliedAt: appliedAt || null,
      cvId: cvId || null,
      coverLetterId: coverLetterId || null,
    };

    try {
      const response = await fetch(job ? `/api/tracker/jobs/${job.id}` : "/api/tracker/jobs", {
        method: job ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.message || t("tracker.toast.error"));
        setSaving(false);
        return;
      }

      addToast({
        type: "success",
        message: job ? t("tracker.toast.updated") : t("tracker.toast.created"),
      });
      onSaved();
      onClose();
    } catch {
      setError(t("tracker.toast.error"));
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={job ? t("tracker.form.edit-title") : t("tracker.form.add-title")}
      size="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label={t("tracker.form.title")}>
          <input
            className={inputClass}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t("tracker.form.title-placeholder")}
            maxLength={255}
            autoFocus
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label={t("tracker.form.company")}>
            <input
              className={inputClass}
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              maxLength={255}
            />
          </FormField>
          <FormField label={t("tracker.form.location")}>
            <input
              className={inputClass}
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              maxLength={300}
            />
          </FormField>
          <FormField label={t("tracker.form.url")}>
            <input
              className={inputClass}
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://"
              maxLength={2000}
            />
          </FormField>
          <FormField label={t("tracker.form.salary")}>
            <input
              className={inputClass}
              value={salaryNote}
              onChange={(event) => setSalaryNote(event.target.value)}
              maxLength={120}
            />
          </FormField>
          <FormField label={t("tracker.form.stage")}>
            <select className={inputClass} value={stageId} onChange={(event) => setStageId(event.target.value)}>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label={t("tracker.form.applied-at")}>
            <input
              type="date"
              className={inputClass}
              value={appliedAt}
              onChange={(event) => setAppliedAt(event.target.value)}
            />
          </FormField>
          <FormField label={t("tracker.form.contact-name")}>
            <input
              className={inputClass}
              value={contactName}
              onChange={(event) => setContactName(event.target.value)}
              maxLength={120}
            />
          </FormField>
          <FormField label={t("tracker.form.contact-info")}>
            <input
              className={inputClass}
              value={contactInfo}
              onChange={(event) => setContactInfo(event.target.value)}
              maxLength={255}
            />
          </FormField>
          <FormField label={t("tracker.form.cv")}>
            <select className={inputClass} value={cvId} onChange={(event) => setCvId(event.target.value)}>
              <option value="">{t("tracker.form.none")}</option>
              {cvOptions.map((cv) => (
                <option key={cv.id} value={cv.id}>
                  {cv.jobTitle}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label={t("tracker.form.cover-letter")}>
            <select
              className={inputClass}
              value={coverLetterId}
              onChange={(event) => setCoverLetterId(event.target.value)}
            >
              <option value="">{t("tracker.form.none")}</option>
              {letterOptions.map((letter) => (
                <option key={letter.id} value={letter.id}>
                  {letter.jobTitle || letter.companyName || t("tracker.form.cover-letter-untitled")}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label={t("tracker.form.description")}>
          <textarea
            className={`${inputClass} min-h-[96px] resize-y`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            maxLength={20000}
          />
        </FormField>

        <FormField label={t("tracker.form.notes")}>
          <textarea
            className={`${inputClass} min-h-[72px] resize-y`}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            maxLength={5000}
          />
        </FormField>

        {error ? (
          <p className="rounded-lg bg-error-container/50 px-3 py-2 text-label-bold text-on-error-container">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-label-bold text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {t("tracker.form.cancel")}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2.5 text-label-bold text-on-primary transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? t("tracker.form.saving") : t("tracker.form.save")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
