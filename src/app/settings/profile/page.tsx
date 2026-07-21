"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";

export default function SettingsProfilePage() {
  const { t } = useTranslation();
  const [name, setName] = useState("M. Teguh Surya Susanto");
  const [email] = useState("teguh@example.com");
  const [phone, setPhone] = useState("+62 812 3456 7890");

  return (
    <div className="flex flex-col gap-8">
      {/* Section: Profil Akun */}
      <section className="bg-white rounded-2xl shadow-soft border border-outline-variant/30 overflow-hidden">
        <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">person</span>
          </div>
          <div>
            <h2 className="font-headline-md text-lg text-on-surface">{t("settings.profile.title")}</h2>
            <p className="text-label-sm text-on-surface-variant">{t("settings.profile.subtitle")}</p>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Avatar + Upload */}
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center text-3xl font-bold text-on-primary-container overflow-hidden">
                <span>MT</span>
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary-container hover:text-primary transition-all">
                <span className="material-symbols-outlined text-sm">photo_camera</span>
              </button>
            </div>
            <div>
              <p className="font-label-bold text-on-surface">{t("settings.profile.photo")}</p>
              <p className="text-label-sm text-on-surface-variant">{t("settings.profile.photo-hint")}</p>
              <button className="mt-2 text-label-bold text-primary hover:underline text-sm">{t("settings.profile.upload-photo")}</button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label={t("settings.profile.full-name")} value={name} onChange={setName} placeholder="Nama lengkap" />
            <Field label={t("settings.profile.email")} value={email} onChange={() => {}} placeholder="email@domain.com" type="email" disabled />
            <Field label={t("settings.profile.phone")} value={phone} onChange={setPhone} placeholder="+62 812..." type="tel" />
          </div>

          {/* Verified Badge */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-primary-fixed/30 text-primary">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <span className="text-label-bold text-sm">{t("settings.profile.verified")}</span>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-outline-variant/30">
            <QuickLink icon="mail" label={t("profile.email")} value={email} />
            <QuickLink icon="phone" label={t("build.contact-whatsapp")} value={phone} />
            <QuickLink icon="link" label={t("profile.linkedin")} placeholder="linkedin.com/in/username" />
            <QuickLink icon="code" label={t("live.form.github")} placeholder="github.com/username" />
            <div className="md:col-span-2">
              <button className="text-primary font-label-bold flex items-center gap-1 text-sm hover:underline">
                <span className="material-symbols-outlined text-lg">add_link</span>
                {t("build.add-link")}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Save Bar */}
      <div className="sticky bottom-0 bg-white rounded-2xl shadow-lg border border-outline-variant/30 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <span className="text-label-bold text-sm">{t("settings.profile.save-auto")}</span>
        </div>
        <button className="bg-primary text-on-primary font-label-bold rounded-lg px-8 py-3 hover:brightness-110 active:scale-95 duration-200 transition-all shadow-md">
          {t("settings.profile.save-btn")}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type, disabled }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-label-bold text-on-surface-variant">{label}</label>
      <input
        type={type || "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md transition-all focus:outline-none focus:border-primary focus:shadow-[0_0_0_2px_rgba(108,69,178,0.1)] disabled:opacity-60 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function QuickLink({ icon, label, value, placeholder }: {
  icon: string; label: string; value?: string; placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-label-sm text-on-surface-variant">{label}</label>
      <div className="flex items-center gap-2 border border-outline-variant rounded-xl px-4 py-3 bg-background">
        <span className="material-symbols-outlined text-outline text-xl">{icon}</span>
        <input
          className="w-full border-none p-0 focus:ring-0 text-body-md bg-transparent placeholder:text-outline"
          placeholder={placeholder}
          defaultValue={value || ""}
        />
      </div>
    </div>
  );
}
