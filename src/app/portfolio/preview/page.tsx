"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import AuthGuard from "@/components/AuthGuard";
import { useTranslation } from "@/lib/i18n";

import { THEMES, DEFAULT_THEME_ID } from "@/components/portfolio/themes";
import { ThemeContext } from "@/components/portfolio/PortfolioCanvas";
import type { ThemeDefinition, PortfolioFormData, ProjectItem, ExperienceItem, EducationItem, CertificationItem, OrganizationItem, HobbyItem, TestimonialItem, ExtraLink } from "@/components/portfolio/types";

import PublishDialog from "@/components/portfolio/PublishDialog";
import HeroSection from "@/components/portfolio/sections/HeroSection";
import AboutSection from "@/components/portfolio/sections/AboutSection";
import StatsSection from "@/components/portfolio/sections/StatsSection";
import SkillsSection from "@/components/portfolio/sections/SkillsSection";
import ProjectsSection from "@/components/portfolio/sections/ProjectsSection";
import ExperienceSection from "@/components/portfolio/sections/ExperienceSection";
import EducationSection from "@/components/portfolio/sections/EducationSection";
import CertificationsSection from "@/components/portfolio/sections/CertificationsSection";
import OrganizationsSection from "@/components/portfolio/sections/OrganizationsSection";
import HobbiesSection from "@/components/portfolio/sections/HobbiesSection";
import TestimonialsSection from "@/components/portfolio/sections/TestimonialsSection";
import ContactSection from "@/components/portfolio/sections/ContactSection";

interface PortfolioData {
  formData: PortfolioFormData;
  projects: ProjectItem[];
  experiences: ExperienceItem[];
  educations: EducationItem[];
  certifications: CertificationItem[];
  organizations: OrganizationItem[];
  hobbies: HobbyItem[];
  testimonials: TestimonialItem[];
  extraLinks: ExtraLink[];
}

import { esc, safeUrl } from "@/lib/portfolio-safety";

/** Generate standalone HTML for export */
function generateExportHtml(data: PortfolioData, theme: ThemeDefinition): string {
  const { formData: f, projects, experiences, educations, certifications, organizations, hobbies, testimonials, extraLinks } = data;
  const c = theme.colors;
  const name = esc([f.heroFirstName, f.heroLastName].filter(Boolean).join(" ") || "Nama Lengkap");
  const skillList = f.skillsMain.split(",").map(s => s.trim()).filter(Boolean);

  const statsCards = [f.aboutYearsExp, f.aboutProjectsDone, f.aboutClientsHappy]
    .filter(Boolean).length
    ? `      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;max-width:600px;margin:0 auto">
        ${f.aboutYearsExp ? `<div style="padding:20px;background:${c.primary}12;border-radius:12px"><div style="font-size:32px;font-weight:700;color:${c.primary}">${esc(f.aboutYearsExp)}</div><div style="font-size:13px;color:${c.textMuted};margin-top:4px">Tahun Pengalaman</div></div>` : ""}
        ${f.aboutProjectsDone ? `<div style="padding:20px;background:${c.primary}12;border-radius:12px"><div style="font-size:32px;font-weight:700;color:${c.primary}">${esc(f.aboutProjectsDone)}</div><div style="font-size:13px;color:${c.textMuted};margin-top:4px">Project Selesai</div></div>` : ""}
        ${f.aboutClientsHappy ? `<div style="padding:20px;background:${c.primary}12;border-radius:12px"><div style="font-size:32px;font-weight:700;color:${c.primary}">${esc(f.aboutClientsHappy)}</div><div style="font-size:13px;color:${c.textMuted};margin-top:4px">Klien Puas</div></div>` : ""}
      </div>`
    : "";

  const expCards = experiences
    .filter(e => e.company || e.position)
    .map(e => `<div class="card mb-4">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px;margin-bottom:4px">
        <strong>${esc(e.position) || "Posisi"}</strong>
        <span style="font-size:13px;color:${c.textMuted}">${esc(e.startDate)}${e.startDate ? " &mdash; " : ""}${e.isPresent ? "Sekarang" : esc(e.endDate || "")}</span>
      </div>
      <div style="color:${c.primary};font-size:14px;margin-bottom:${e.description ? "8px" : "0"}">${esc(e.company)}</div>
      ${e.description ? `<p>${esc(e.description)}</p>` : ""}
    </div>`)
    .join("\n");

  const eduCards = educations
    .filter(e => e.institution || e.degree)
    .map(e => `<div class="card">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
        <div style="width:40px;height:40px;border-radius:12px;background:${c.primary}15;display:flex;align-items:center;justify-content:center;color:${c.primary}">S</div>
        <div>
          <strong>${esc(e.degree) || "Gelar"}</strong>
          <div style="font-size:12px;color:${c.textMuted}">${esc(e.startDate)}${e.startDate ? " &mdash; " : ""}${e.isPresent ? "Sekarang" : esc(e.endDate || "")}</div>
        </div>
      </div>
      <div style="color:${c.primary};font-size:14px">${esc(e.institution)}</div>
      ${e.field ? `<p style="font-size:12px;margin-top:4px">${esc(e.field)}</p>` : ""}
    </div>`)
    .join("\n");

  const projCards = projects
    .filter(p => p.name)
    .map(p => {
      const techs = p.techStack
        ? p.techStack.split(",").map(t => `<span style="font-size:11px;padding:4px 10px;border-radius:20px;background:${c.primary}15;color:${c.secondary}">${esc(t.trim())}</span>`).join("")
        : "";
      return `<div class="card">
        <h3 style="margin-bottom:8px">${esc(p.name)}</h3>
        ${p.description ? `<p style="margin-bottom:16px">${esc(p.description)}</p>` : ""}
        ${techs ? `<div class="flex-wrap mb-4">${techs}</div>` : ""}
        ${p.link && safeUrl(p.link) ? `<a href="${safeUrl(p.link)}" target="_blank" rel="noopener noreferrer" style="color:${c.primary};font-weight:600;font-size:13px">Lihat Detail &rarr;</a>` : ""}
      </div>`;
    })
    .join("\n");

  const skillChips = skillList.length
    ? skillList.map(s => `<span style="padding:8px 16px;border-radius:100px;background:${c.primary}15;border:1px solid ${c.primary}25;font-size:13px;font-weight:500;color:${c.accent}">${esc(s)}</span>`).join("")
    : "";

  const tmCards = testimonials
    .filter(tm => tm.name || tm.testimonial)
    .map(tm => `<div class="card">
      <p style="font-style:italic;margin-bottom:16px">&ldquo;${esc(tm.testimonial)}&rdquo;</p>
      <div><strong>${esc(tm.name)}</strong>${tm.position ? `<span style="font-size:12px;color:${c.textMuted};margin-left:8px">${esc(tm.position)}</span>` : ""}</div>
    </div>`)
    .join("\n");

  const certCards = (certifications || [])
    .filter(cert => cert.name)
    .map(cert => `<div class="card">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
        <div style="width:40px;height:40px;border-radius:12px;background:${c.primary}15;display:flex;align-items:center;justify-content:center;color:${c.primary}">&#127942;</div>
        <div>
          <strong>${esc(cert.name)}</strong>
          ${cert.year ? `<div style="font-size:12px;color:${c.textMuted}">${esc(cert.year)}</div>` : ""}
        </div>
      </div>
      ${cert.issuer ? `<div style="color:${c.primary};font-size:14px">${esc(cert.issuer)}</div>` : ""}
      ${cert.url && safeUrl(cert.url) ? `<a href="${safeUrl(cert.url)}" target="_blank" rel="noopener noreferrer" style="color:${c.primary};font-weight:600;font-size:12px">Lihat Sertifikat &rarr;</a>` : ""}
    </div>`)
    .join("\n");

  const orgCards = (organizations || [])
    .filter(org => org.name)
    .map(org => `<div class="card">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px;margin-bottom:4px">
        <strong>${esc(org.name)}</strong>
        ${org.period ? `<span style="font-size:12px;color:${c.textMuted}">${esc(org.period)}</span>` : ""}
      </div>
      ${org.role ? `<div style="color:${c.primary};font-size:14px;margin-bottom:${org.description ? "8px" : "0"}">${esc(org.role)}</div>` : ""}
      ${org.description ? `<p>${esc(org.description)}</p>` : ""}
    </div>`)
    .join("\n");

  const hobbyChips = (hobbies || [])
    .filter(h => h.name)
    .map(h => `<span style="padding:8px 16px;border-radius:100px;background:${c.primary}15;border:1px solid ${c.primary}25;font-size:13px;font-weight:500;color:${c.accent}">${esc(h.name)}</span>`)
    .join("");

  const contactItems = [];
  if (f.contactEmail) contactItems.push(`<a href="mailto:${esc(f.contactEmail)}" style="padding:8px 16px;border-radius:12px;border:1px solid ${c.border};color:${c.textMuted};font-size:13px;text-decoration:none">Email</a>`);
  if (f.contactPhone) contactItems.push(`<a href="tel:${esc(f.contactPhone)}" style="padding:8px 16px;border-radius:12px;border:1px solid ${c.border};color:${c.textMuted};font-size:13px;text-decoration:none">${esc(f.contactPhone)}</a>`);
  if (f.contactLinkedin) contactItems.push(`<a href="${safeUrl(f.contactLinkedin)}" target="_blank" rel="noopener noreferrer" style="padding:8px 16px;border-radius:12px;border:1px solid ${c.border};color:${c.textMuted};font-size:13px;text-decoration:none">LinkedIn</a>`);
  if (f.contactGithub) contactItems.push(`<a href="${safeUrl(f.contactGithub)}" target="_blank" rel="noopener noreferrer" style="padding:8px 16px;border-radius:12px;border:1px solid ${c.border};color:${c.textMuted};font-size:13px;text-decoration:none">GitHub</a>`);
  extraLinks.filter(l => l.url).forEach(l => {
    const safe = safeUrl(l.url);
    if (safe) contactItems.push(`<a href="${safe}" target="_blank" rel="noopener noreferrer" style="padding:8px 16px;border-radius:12px;border:1px solid ${c.border};color:${c.textMuted};font-size:13px;text-decoration:none">${esc(l.label) || "Link"}</a>`);
  });

  return `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${name} | Portfolio</title>
<link href="${theme.fontUrl}" rel="stylesheet"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:${c.bg};color:${c.text};font-family:${theme.font},sans-serif;font-size:16px}
.container{max-width:1140px;margin:0 auto;padding:0 24px}
section{padding:80px 0}
h2{font-size:1.5rem;font-weight:700;margin-bottom:24px}
p{line-height:1.7;color:${c.textMuted}}
.card{padding:24px;border-radius:16px;background:${c.surface};border:1px solid ${c.border};margin-bottom:16px}
.flex-wrap{display:flex;flex-wrap:wrap;gap:8px}
.mb-4{margin-bottom:16px}
.grid-2{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}
.text-center{text-align:center}
@media(max-width:768px){section{padding:48px 0}}
</style></head>
<body>
<div class="container">
<section style="padding-top:100px;text-align:center">
<h1 style="font-size:clamp(2rem,5vw,3rem);font-weight:800">Halo, Saya <span style="color:${c.primary}">${name}</span></h1>
${f.heroHeadline ? `<p style="font-size:18px;color:${c.textSecondary};margin-top:8px">${esc(f.heroHeadline)}</p>` : ""}
${f.heroBio ? `<p style="max-width:600px;margin:16px auto 24px">${esc(f.heroBio)}</p>` : ""}
</section>
${f.aboutText ? `<section><div class="card"><p>${esc(f.aboutText)}</p></div></section>` : ""}
${statsCards ? `<section class="text-center">${statsCards}</section>` : ""}
${expCards ? `<section><h2>Pengalaman Kerja</h2>${expCards}</section>` : ""}
${eduCards ? `<section><div class="grid-2"><h2>Pendidikan</h2>${eduCards}</div></section>` : ""}
${projCards ? `<section><h2>Project</h2><div class="grid-2">${projCards}</div></section>` : ""}
${skillChips ? `<section><h2>Keahlian</h2><div class="card"><div class="flex-wrap">${skillChips}</div>${f.skillsTools ? `<p style="margin-top:12px"><strong>Tools:</strong> ${esc(f.skillsTools)}</p>` : ""}${f.skillsLanguages ? `<p style="margin-top:4px"><strong>Bahasa:</strong> ${esc(f.skillsLanguages)}</p>` : ""}</div></section>` : ""}
${certCards ? `<section><h2>Sertifikat &amp; Penghargaan</h2><div class="grid-2">${certCards}</div></section>` : ""}
${orgCards ? `<section><h2>Organisasi &amp; Kepanitiaan</h2>${orgCards}</section>` : ""}
${hobbyChips ? `<section><h2>Hobi &amp; Minat</h2><div class="card"><div class="flex-wrap">${hobbyChips}</div></div></section>` : ""}
${tmCards ? `<section><div class="grid-2">${tmCards}</div></section>` : ""}
${contactItems.length ? `<section id="contact" style="text-align:center"><h2>Mari Bekerja Sama</h2><p style="margin-bottom:24px">Punya ide menarik? Hubungi saya.</p><div class="flex-wrap" style="justify-content:center">${contactItems.join("")}</div></section>` : ""}
<footer style="text-align:center;padding:32px 0;border-top:1px solid ${c.border};font-size:12px;color:${c.textMuted}">&copy; 2026 ${name}. Dibuat dengan AI Career Hub</footer>
</div>
</body></html>`;
}

export default function PortfolioPreviewPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [themeId, setThemeId] = useState<string>(DEFAULT_THEME_ID);
  const [showPublish, setShowPublish] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("template");
    if (t && THEMES[t]) {
      setThemeId(t);
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("portfolio_draft");
      if (raw) {
        const parsed: PortfolioData = JSON.parse(raw);
        setData(parsed);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    }
  }, []);

  if (notFound) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background text-on-background">
          <AppHeader />
          <main className="pt-32 px-6 flex flex-col items-center justify-center text-center gap-6">
            <span className="material-symbols-outlined text-6xl text-outline">description</span>
            <h1 className="font-headline-md text-on-surface">{t("preview.no-draft-title")}</h1>
            <p className="text-body-md text-on-surface-variant max-w-md">{t("preview.no-draft-desc")}</p>
            <Link href="/portfolio/live" className="bg-primary text-on-primary font-label-bold rounded-xl px-8 py-3 hover:brightness-110 transition-all shadow-md">
              {t("preview.open-builder")}
            </Link>
          </main>
        </div>
      </AuthGuard>
    );
  }

  if (!data) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
        </div>
      </AuthGuard>
    );
  }

  const theme = THEMES[themeId] || THEMES[DEFAULT_THEME_ID];
  const { formData: f, projects, experiences, educations, certifications, organizations, hobbies, testimonials, extraLinks } = data;
  const name = [f.heroFirstName, f.heroLastName].filter(Boolean).join(" ") || "Nama Lengkap";

  return (
    <AuthGuard>
      <ThemeContext.Provider value={theme}>
        <div
          className="min-h-screen"
          style={{
            backgroundColor: theme.colors.bg,
            color: theme.colors.text,
            fontFamily: theme.font.includes(" ") ? `'${theme.font}', sans-serif` : `${theme.font}, sans-serif`,
          }}
        >
          <AppHeader />
          <main className="pt-20 pb-16 px-4 md:px-6">
            <div className="mx-auto" style={{ maxWidth: 1140 }}>
              {/* Toolbar */}
              <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <h1 className="font-headline-md" style={{ color: theme.colors.text }}>{t("preview.title")}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Theme Switcher */}
                  <div className="flex items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: theme.colors.bgSecondary, border: `1px solid ${theme.colors.border}` }}>
                    {Object.keys(THEMES).map((tid) => (
                      <button
                        key={tid}
                        onClick={() => setThemeId(tid)}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                        style={{
                          backgroundColor: themeId === tid ? theme.colors.primary : "transparent",
                          color: themeId === tid ? "#fff" : theme.colors.textMuted,
                        }}
                      >
                        {THEMES[tid].name}
                      </button>
                    ))}
                  </div>
                  <Link href="/portfolio/live" className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={{ border: `1px solid ${theme.colors.border}`, color: theme.colors.text }}>
                    {t("preview.edit")}
                  </Link>
                  <button
                    onClick={() => setShowPublish(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={{ backgroundColor: theme.colors.primary, color: "#fff" }}
                  >
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">rocket_launch</span>
                    {t("portfolio.publish-btn")}
                  </button>
                  <button
                    onClick={() => {
                      const html = generateExportHtml(data, theme);
                      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${name.replace(/[\s\/\\]/g, "_")}_Portfolio.html`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={{ border: `1px solid ${theme.colors.border}`, color: theme.colors.text }}
                  >
                    {t("preview.export-html")}
                  </button>
                </div>
              </div>

              {/* Section Components */}
              <HeroSection data={f} />
              <AboutSection data={f} />
              <StatsSection data={f} />
              <ExperienceSection items={experiences} />
              <EducationSection items={educations} />
              <ProjectsSection items={projects} />
              <SkillsSection data={f} />
              <CertificationsSection items={certifications || []} />
              <OrganizationsSection items={organizations || []} />
              <HobbiesSection items={hobbies || []} />
              <TestimonialsSection items={testimonials} />
              <ContactSection data={f} extraLinks={extraLinks} />

              {/* Info */}
              <div className="px-6 mt-4">
                <div style={{ padding: 14, borderRadius: 12, background: `${theme.colors.primary}0D`, border: `1px solid ${theme.colors.primary}1A`, fontSize: 13, color: theme.colors.textMuted, textAlign: "center" }}>
                  {t("preview.template")}: <strong style={{ color: theme.colors.primary }}>{theme.name}</strong> &middot; Font: {theme.font}
                </div>
              </div>
            </div>
          </main>
          <footer className="text-center py-8" style={{ color: theme.colors.textMuted, borderTop: `1px solid ${theme.colors.border}`, fontSize: 13 }}>
            &copy; {new Date().getFullYear()}. Dibuat dengan AI Career Hub
          </footer>
        </div>
      </ThemeContext.Provider>

      {/* Publish dialog */}
      <PublishDialog open={showPublish} onClose={() => setShowPublish(false)} data={data} themeId={themeId} />
    </AuthGuard>
  );
}
