"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";

export default function SettingsSecurityPage() {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const toggleShow = (field: string) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Section: Kata Sandi & Keamanan */}
      <section className="bg-white rounded-2xl shadow-soft border border-outline-variant/30 overflow-hidden">
        <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">lock</span>
          </div>
          <div>
            <h2 className="font-headline-md text-lg text-on-surface">{t("security.title")}</h2>
            <p className="text-label-sm text-on-surface-variant">{t("security.subtitle")}</p>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Ganti Password */}
          <div>
            <h3 className="font-label-bold text-on-surface mb-4">{t("security.change-password")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-label-bold text-on-surface-variant">{t("security.current-password")}</label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md transition-all focus:outline-none focus:border-primary focus:shadow-[0_0_0_2px_rgba(108,69,178,0.1)] pr-12"
                    placeholder="Masukkan kata sandi saat ini"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow("current")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPasswords.current ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-label-bold text-on-surface-variant">{t("security.new-password")}</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md transition-all focus:outline-none focus:border-primary focus:shadow-[0_0_0_2px_rgba(108,69,178,0.1)] pr-12"
                    placeholder="Minimal 8 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow("new")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPasswords.new ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-label-bold text-on-surface-variant">{t("security.confirm-password")}</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-background text-body-md transition-all focus:outline-none focus:border-primary focus:shadow-[0_0_0_2px_rgba(108,69,178,0.1)] pr-12"
                    placeholder="Ketik ulang kata sandi baru"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow("confirm")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPasswords.confirm ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
              <div className="md:col-span-2">
                <button className="bg-primary text-on-primary font-label-bold rounded-lg px-8 py-3 hover:brightness-110 active:scale-95 duration-200 transition-all shadow-md">
                  {t("security.update-btn")}
                </button>
              </div>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="mt-8 pt-6 border-t border-outline-variant/30">
            <h3 className="font-label-bold text-on-surface mb-4">{t("security.sessions-title")}</h3>
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-outline-variant bg-background flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-fixed/50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">laptop</span>
                  </div>
                  <div>
                    <p className="font-label-bold text-sm text-on-surface">Windows 11 · Chrome 120</p>
                    <p className="text-label-sm text-on-surface-variant">IP: 192.168.1.10 · Login 2 jam yang lalu</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-label-sm font-bold">{t("security.active")}</span>
              </div>
              <div className="p-4 rounded-xl border border-outline-variant bg-background flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-outline">smartphone</span>
                  </div>
                  <div>
                    <p className="font-label-bold text-sm text-on-surface">Android 14 · Chrome Mobile</p>
                    <p className="text-label-sm text-on-surface-variant">Login 3 hari yang lalu</p>
                  </div>
                </div>
                <button className="text-label-sm text-error hover:underline">{t("security.revoke")}</button>
              </div>
            </div>
          </div>

          {/* Last Login Info */}
          <div className="mt-4 p-4 rounded-xl bg-surface-container border border-dashed border-primary/30 text-sm text-on-surface-variant flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">info</span>
            <span>{t("security.last-login")} <strong className="text-on-surface">12 Jan 2025, 14:32 WIB</strong></span>
          </div>
        </div>
      </section>
    </div>
  );
}
