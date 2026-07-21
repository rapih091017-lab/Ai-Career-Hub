"use client";

import { useState, useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import AuthGuard from "@/components/AuthGuard";
import { useTranslation } from "@/lib/i18n";
import MagneticButton from "@/components/MagneticButton";
import { useToast } from "@/components/ui/toast";

interface PersonalInfo {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  linkedin: string;
  summary: string;
}

interface WorkItem {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  isPresent?: boolean;
}

interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
}

interface OrganisationItem {
  id: string;
  name: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  isPresent?: boolean;
}

interface SkillItem {
  id: string;
  name: string;
  level: "beginner" | "intermediate" | "advanced";
}

function HelpIcon() {
  return (
    <div className="relative group inline-block ml-1 align-middle">
      <span className="material-symbols-outlined text-[16px] text-outline cursor-help select-none">help_outline</span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-inverse-surface text-inverse-on-surface text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-56 text-left shadow-lg z-[100]">
        Contoh: Memimpin tim 5 orang untuk mengembangkan fitur baru, menghasilkan peningkatan konversi sebesar 15%.
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-inverse-surface" />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [profileExists, setProfileExists] = useState(false);
  const [activeSection, setActiveSection] = useState("section-personal");
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useToast();

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    fullName: "", phone: "", email: "", address: "", linkedin: "", summary: "",
  });

  const [workHistory, setWorkHistory] = useState<WorkItem[]>([]);
  const [education, setEducation] = useState<EducationItem[]>([]);
  const [organisations, setOrganisation] = useState<OrganisationItem[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);

  useEffect(() => {
    fetch("/api/profile")
      .then(async (res) => {
        if (res.status === 404) { setProfileExists(false); return; }
        if (res.ok) {
          const data = await res.json();
          setProfileExists(true);
          if (data.personalInfo) setPersonalInfo(data.personalInfo);
          if (data.workHistory) setWorkHistory(data.workHistory);
          if (data.education) setEducation(data.education);
          if (data.organisations) setOrganisation(data.organisations);
          if (data.skills) setSkills(data.skills);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // Hitung progres berdasarkan field yang terisi (bukan sekedar section ada datanya)
  const personalFields = [personalInfo.fullName, personalInfo.phone, personalInfo.email, personalInfo.address, personalInfo.linkedin, personalInfo.summary].filter(Boolean).length;
  const personalScore = (personalFields / 6) * 20;
  const workScore = workHistory.reduce((total, w) => {
    const filled = [w.company, w.position, w.description].filter(Boolean).length;
    return total + (filled / 3) * 20;
  }, 0) / Math.max(workHistory.length, 1);
  const eduScore = education.reduce((total, e) => {
    const filled = [e.institution, e.degree, e.field].filter(Boolean).length;
    return total + (filled / 3) * 20;
  }, 0) / Math.max(education.length, 1);
  const orgScore = organisations.reduce((total, o) => {
    const filled = [o.name, o.position, o.description].filter(Boolean).length;
    return total + (filled / 3) * 20;
  }, 0) / Math.max(organisations.length, 1);
  const skillScore = skills.reduce((total, s) => s.name ? total + 20 : total, 0) / Math.max(skills.length, 1);

  const progress = Math.round(
    (education.length === 0 ? 0 : eduScore) +
    (workHistory.length === 0 ? 0 : workScore) +
    (organisations.length === 0 ? 0 : orgScore) +
    (skills.length === 0 ? 0 : skillScore) +
    personalScore
  );

  const toggleSection = (id: string) => setActiveSection((prev) => (prev === id ? "" : id));

  const updatePersonal = (field: keyof PersonalInfo, value: string) => setPersonalInfo((prev) => ({ ...prev, [field]: value }));

  const updateWork = (id: string, field: keyof WorkItem, value: string) => setWorkHistory((prev) => prev.map((w) => (w.id === id ? { ...w, [field]: value } : w)));
  const toggleWorkPresent = (id: string, present: boolean) => setWorkHistory((prev) => prev.map((w) => w.id === id ? { ...w, isPresent: present, endDate: present ? "" : w.endDate } : w));
  const toggleWorkPresentEdu = (id: string, present: boolean) => setEducation((prev) => prev.map((e) => e.id === id ? { ...e, isPresent: present, endDate: present ? "" : e.endDate } : e));
  const deleteWork = (id: string) => setWorkHistory((prev) => prev.filter((w) => w.id !== id));
  const addWork = () => { setWorkHistory((prev) => [...prev, { id: "wh_" + Date.now(), company: "", position: "", startDate: "", endDate: "", description: "", isPresent: false }]); setActiveSection("section-experience"); };

  const updateEdu = (id: string, field: keyof EducationItem, value: string) => setEducation((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  const deleteEdu = (id: string) => setEducation((prev) => prev.filter((e) => e.id !== id));
  const addEdu = () => { setEducation((prev) => [...prev, { id: "edu_" + Date.now(), institution: "", degree: "", field: "", startDate: "", endDate: "" }]); setActiveSection("section-education"); };

  const updateOrg = (id: string, field: keyof OrganisationItem, value: string) => setOrganisation((prev) => prev.map((o) => (o.id === id ? { ...o, [field]: value } : o)));
  const toggleOrgPresent = (id: string, present: boolean) => setOrganisation((prev) => prev.map((o) => o.id === id ? { ...o, isPresent: present, endDate: present ? "" : o.endDate } : o));
  const deleteOrg = (id: string) => setOrganisation((prev) => prev.filter((o) => o.id !== id));
  const addOrg = () => { setOrganisation((prev) => [...prev, { id: "org_" + Date.now(), name: "", position: "", startDate: "", endDate: "", description: "", isPresent: false }]); setActiveSection("section-organisation"); };

  const updateSkill = (id: string, field: keyof SkillItem, value: string) => setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  const deleteSkill = (id: string) => setSkills((prev) => prev.filter((s) => s.id !== id));
  const addSkill = () => { setSkills((prev) => [...prev, { id: "sk_" + Date.now(), name: "", level: "intermediate" }]); setActiveSection("section-skills"); };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const method = profileExists ? "PUT" : "POST";
      const url = profileExists ? "/api/profile/update" : "/api/profile/create";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personalInfo, workHistory, education, organisations, skills }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfileExists(true);
        if (data.personalInfo) setPersonalInfo(data.personalInfo);
        if (data.workHistory) setWorkHistory(data.workHistory);
        if (data.education) setEducation(data.education);
        if (data.organisations) setOrganisation(data.organisations);
        if (data.skills) setSkills(data.skills);
      } else {
        const err = await res.json();
        addToast({ type: "error", message: "Gagal menyimpan: " + (err.message || "Error") });
      }
    } catch {
      addToast({ type: "error", message: "Gagal menyimpan. Periksa koneksi Anda." });
    } finally { setIsSaving(false); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background text-on-background">
        <AppHeader />
        <main className="pt-20 pb-32 px-margin-mobile md:px-gutter flex justify-center">
          <div className="w-full max-w-[800px] flex flex-col gap-6">
            {/* Progress */}
            <section className="bg-white rounded-xl p-8 shadow-soft border-t-4 border-primary">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h1 className="font-headline-lg text-on-background mb-1">{t("profile.title")}</h1>
                  <p className="font-body-md text-on-surface-variant">{t("profile.subtitle")}</p>
                </div>
                <span className="font-label-bold text-primary text-lg">{progress}% {t("profile.progress-label")}</span>
              </div>
              <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
              </div>
            </section>

            <div className="flex flex-col gap-4">
              {/* 1. Personal Info */}
              <Accordion id="section-personal" icon="person" title={t("profile.personal-info")} isOpen={activeSection === "section-personal"} onToggle={toggleSection}>
                <div className="px-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label={t("profile.full-name")}><Input value={personalInfo.fullName} onChange={(e) => updatePersonal("fullName", e.target.value)} placeholder="Masukkan nama lengkap" /></Field>
                  <Field label={t("profile.email")}><Input value={personalInfo.email} onChange={(e) => updatePersonal("email", e.target.value)} placeholder="email@domain.com" type="email" /></Field>
                  <Field label={t("profile.phone")}><Input value={personalInfo.phone} onChange={(e) => updatePersonal("phone", e.target.value)} placeholder="08xxx" type="tel" /></Field>
                  <Field label={t("profile.location")}><Input value={personalInfo.address} onChange={(e) => updatePersonal("address", e.target.value)} placeholder="Kota, Provinsi" /></Field>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-label-bold text-on-surface-variant">{t("profile.linkedin")}</label>
                    <Input value={personalInfo.linkedin} onChange={(e) => updatePersonal("linkedin", e.target.value)} placeholder="https://linkedin.com/in/..." type="url" />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-label-bold text-on-surface-variant">{t("profile.summary")}</label>
                    <textarea className="w-full p-3 rounded-xl border border-outline-variant bg-background text-body-md resize-none" placeholder="Ceritakan singkat tentang diri Anda..." rows={4} value={personalInfo.summary} onChange={(e) => updatePersonal("summary", e.target.value)} />
                  </div>
                </div>
              </Accordion>

              {/* 2. Experience */}
              <Accordion id="section-experience" icon="work" title={t("profile.experience")} isOpen={activeSection === "section-experience"} onToggle={toggleSection}>
                <div className="px-6 flex flex-col gap-6">
                  {workHistory.map((item) => (
                    <WorkCard key={item.id} item={item} updateWork={updateWork} deleteWork={deleteWork} onPresentChange={(p) => toggleWorkPresent(item.id, p)} />
                  ))}
                  <AddBtn onClick={addWork} label={t("profile.add-experience")} />
                </div>
              </Accordion>

              {/* 3. Education */}
              <Accordion id="section-education" icon="school" title={t("profile.education")} isOpen={activeSection === "section-education"} onToggle={toggleSection}>
                <div className="px-6 flex flex-col gap-6">
                  {education.map((item) => (
                    <div key={item.id} className="p-5 rounded-xl border border-outline-variant bg-surface-container-low">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-label-bold text-primary">{item.degree || "Pendidikan Baru"}</h4>
                        <button className="text-error hover:bg-error-container/30 p-1 rounded transition-colors" onClick={() => deleteEdu(item.id)} aria-label="Hapus pendidikan">
                          <span className="material-symbols-outlined select-none" aria-hidden="true">delete</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5 md:col-span-2">
                          <label className="text-label-sm text-on-surface-variant uppercase tracking-wider">{t("profile.institution")}</label>
                          <Input value={item.institution} onChange={(e) => updateEdu(item.id, "institution", e.target.value)} />
                        </div>
                        <Field label={t("profile.degree")}><Input value={item.degree} onChange={(e) => updateEdu(item.id, "degree", e.target.value)} /></Field>
                        <Field label={t("profile.field")}><Input value={item.field} onChange={(e) => updateEdu(item.id, "field", e.target.value)} placeholder="Opsional" /></Field>
                        <Field label={t("profile.start-date")}><Input value={item.startDate} onChange={(e) => updateEdu(item.id, "startDate", e.target.value)} type="month" /></Field>
                        <Field label={t("profile.end-date")}><Input value={item.endDate} onChange={(e) => updateEdu(item.id, "endDate", e.target.value)} type="month" /></Field>
                      </div>
                    </div>
                  ))}                    <AddBtn onClick={addEdu} label={t("profile.add-education")} />
                </div>
              </Accordion>

              {/* 4. Organizations */}
              <Accordion id="section-organisation" icon="groups" title={t("profile.organization")} isOpen={activeSection === "section-organisation"} onToggle={toggleSection}>
                <div className="px-6 flex flex-col gap-6">
                  {organisations.map((item) => (
                    <OrgCard key={item.id} item={item} updateOrg={updateOrg} deleteOrg={deleteOrg} onPresentChange={(p) => toggleOrgPresent(item.id, p)} />
                  ))}
                  <AddBtn onClick={addOrg} label={t("profile.add-organization")} />
                </div>
              </Accordion>

              {/* 5. Skills */}
              <Accordion id="section-skills" icon="stars" title={t("profile.skills")} isOpen={activeSection === "section-skills"} onToggle={toggleSection}>
                <div className="px-6 flex flex-col gap-4">
                  {skills.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 border border-outline-variant rounded-xl p-3 bg-background">
                      <input className="flex-1 p-2 rounded-lg border border-outline-variant bg-white text-body-md" placeholder="Nama skill..." value={item.name} onChange={(e) => updateSkill(item.id, "name", e.target.value)} />
                      <select className="p-2 rounded-lg border border-outline-variant bg-white text-body-md" value={item.level} onChange={(e) => updateSkill(item.id, "level", e.target.value)}>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                      <button className="text-error hover:bg-error-container/30 p-1 rounded" onClick={() => deleteSkill(item.id)} aria-label="Hapus skill">
                        <span className="material-symbols-outlined select-none" aria-hidden="true">close</span>
                      </button>
                    </div>
                  ))}
                  <AddBtn onClick={addSkill} label={t("profile.add-skill")} />
                </div>
              </Accordion>
            </div>
          </div>
        </main>

        {/* Sticky Save */}
        <footer className="fixed bottom-0 left-0 w-full z-50 bg-white shadow-lg border-t border-outline-variant/10">
          <div className="max-w-[1200px] mx-auto px-5 md:px-10 h-20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-xl select-none">save</span>
              <span className="text-label-bold">{t("profile.save-hint")}</span>
            </div>
            <MagneticButton>
              <button
                className="bg-primary text-on-primary px-10 py-3 rounded-xl font-label-bold shadow-md hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-95 disabled:opacity-50"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? t("profile.saving") : t("profile.save-btn")}
              </button>
            </MagneticButton>
          </div>
        </footer>
      </div>
    </AuthGuard>
  );
}

/* Sub-components */

function Accordion({ id, icon, title, isOpen, onToggle, children }: {
  id: string; icon: string; title: string; isOpen: boolean; onToggle: (id: string) => void; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow-soft">
      <button className="w-full flex items-center justify-between p-6 text-left" onClick={() => onToggle(id)}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
            <span className="material-symbols-outlined select-none">{icon}</span>
          </div>
          <h3 className="font-headline-md text-on-surface">{title}</h3>
        </div>
        <span className={`material-symbols-outlined transition-transform duration-300 select-none ${isOpen ? "rotate-180" : ""}`}>expand_more</span>
      </button>
      <div className={`accordion-content ${isOpen ? "!max-h-[4000px] !pb-6" : ""}`}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5"><label className="text-label-bold text-on-surface-variant">{label}</label>{children}</div>;
}

function Input({ value, onChange, placeholder, type }: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; type?: string }) {
  return <input className="w-full p-3 rounded-xl border border-outline-variant bg-background text-body-md" placeholder={placeholder} type={type || "text"} value={value} onChange={onChange} />;
}

function AddBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button className="w-full py-4 rounded-xl border-2 border-dashed border-outline-variant text-on-surface-variant font-label-bold flex items-center justify-center gap-2 hover:bg-surface-container-low hover:border-primary/50 transition-all" onClick={onClick}>
      <span className="material-symbols-outlined select-none">add</span>
      {label}
    </button>
  );
}

function WorkCard({ item, updateWork, deleteWork, onPresentChange }: { item: WorkItem; updateWork: (id: string, f: keyof WorkItem, v: string) => void; deleteWork: (id: string) => void; onPresentChange?: (present: boolean) => void }) {
  const { t } = useTranslation();
  return (
    <div className="p-5 rounded-xl border border-outline-variant bg-surface-container-low">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-label-bold text-primary">{item.position || "Posisi Baru"}</h4>
        <button className="text-error hover:bg-error-container/30 p-1 rounded transition-colors" onClick={() => deleteWork(item.id)} aria-label="Hapus pengalaman">
          <span className="material-symbols-outlined select-none" aria-hidden="true">delete</span>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={t("profile.company")}><Input value={item.company} onChange={(e) => updateWork(item.id, "company", e.target.value)} /></Field>
        <Field label={t("profile.position")}><Input value={item.position} onChange={(e) => updateWork(item.id, "position", e.target.value)} /></Field>
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-label-sm text-on-surface-variant uppercase tracking-wider">{t("profile.start-date")} - {t("profile.end-date")}</label>
          <div className="flex items-center gap-2">
            <Input value={item.startDate} onChange={(e) => updateWork(item.id, "startDate", e.target.value)} type="month" />
            <span className="text-on-surface-variant">ke</span>
            {item.isPresent ? (
              <div className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container-low text-body-md text-on-surface-variant">{t("profile.current")}</div>
            ) : (
              <Input value={item.endDate} onChange={(e) => updateWork(item.id, "endDate", e.target.value)} type="month" />
            )}
          </div>
          <label className="flex items-center gap-2 mt-1 cursor-pointer group">
            <input type="checkbox" checked={item.isPresent ?? false}
              onChange={e => updateWork(item.id, "endDate", e.target.checked ? "" : item.endDate)}
              className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/30"
            />
            <span className="text-xs text-on-surface-variant group-hover:text-on-surface transition-colors">{t("profile.current")}</span>
          </label>
        </div>
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-label-sm text-on-surface-variant uppercase tracking-wider flex items-center">
            {t("profile.responsibility")} <HelpIcon />
          </label>
          <textarea className="w-full p-3 rounded-xl border border-outline-variant bg-background text-body-md resize-none" placeholder="Tuliskan pencapaian dan tanggung jawab utama Anda..." rows={3} value={item.description} onChange={(e) => updateWork(item.id, "description", e.target.value)} />
        </div>
      </div>
    </div>
  );
}

function OrgCard({ item, updateOrg, deleteOrg, onPresentChange }: { item: OrganisationItem; updateOrg: (id: string, f: keyof OrganisationItem, v: string) => void; deleteOrg: (id: string) => void; onPresentChange?: (present: boolean) => void }) {
  const { t } = useTranslation();
  return (
    <div className="p-5 rounded-xl border border-outline-variant bg-surface-container-low">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-label-bold text-primary">{item.name || "Organisasi Baru"}</h4>
        <button className="text-error hover:bg-error-container/30 p-1 rounded transition-colors" onClick={() => deleteOrg(item.id)} aria-label="Hapus organisasi">
          <span className="material-symbols-outlined select-none" aria-hidden="true">delete</span>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={t("profile.organization")}><Input value={item.name} onChange={(e) => updateOrg(item.id, "name", e.target.value)} /></Field>
        <Field label={t("profile.position")}><Input value={item.position} onChange={(e) => updateOrg(item.id, "position", e.target.value)} /></Field>          <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-label-sm text-on-surface-variant uppercase tracking-wider">Tanggal Mulai - Selesai</label>
          <div className="flex items-center gap-2">
            <Input value={item.startDate} onChange={(e) => updateOrg(item.id, "startDate", e.target.value)} type="month" />
            <span className="text-on-surface-variant">ke</span>
            {item.isPresent ? (
              <div className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container-low text-body-md text-on-surface-variant">{t("profile.current")}</div>
            ) : (
              <Input value={item.endDate} onChange={(e) => updateOrg(item.id, "endDate", e.target.value)} type="month" />
            )}
          </div>
          <label className="flex items-center gap-2 mt-1 cursor-pointer group">
            <input type="checkbox" checked={item.isPresent ?? false}
              onChange={e => updateOrg(item.id, "endDate", e.target.checked ? "" : item.endDate)}
              className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/30"
            />
            <span className="text-xs text-on-surface-variant group-hover:text-on-surface transition-colors">{t("profile.current")}</span>
          </label>
        </div>
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-label-sm text-on-surface-variant uppercase tracking-wider flex items-center">
            {t("profile.description")} <HelpIcon />
          </label>
          <textarea className="w-full p-3 rounded-xl border border-outline-variant bg-background text-body-md resize-none" placeholder="Deskripsikan peran dan kontribusi Anda..." rows={3} value={item.description} onChange={(e) => updateOrg(item.id, "description", e.target.value)} />
        </div>
      </div>
    </div>
  );
}
