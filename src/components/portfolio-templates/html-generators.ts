import { PortfolioFormData, ProjectItem, ExperienceItem, EducationItem, TestimonialItem, ExtraLink } from "./types";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* ──────────────── HELPERS ──────────────── */

function initials(f: PortfolioFormData): string {
  return ((f.heroFirstName?.[0] || "") + (f.heroLastName?.[0] || "")).toUpperCase() || "?";
}
function fullName(f: PortfolioFormData): string {
  return [f.heroFirstName, f.heroLastName].filter(Boolean).join(" ") || "Nama Lengkap";
}

/* ──────────────── TEMPLATE 1: PORTO PREMIUM (DARK INDIGO) ──────────────── */

export function generatePortoPremiumHtml(
  f: PortfolioFormData, projects: ProjectItem[], experiences: ExperienceItem[],
  educations: EducationItem[], testimonials: TestimonialItem[], extraLinks: ExtraLink[]
): string {
  const name = esc(fullName(f));
  const init = esc(initials(f));
  const skillTags = f.skillsMain.split(",").map(s => s.trim()).filter(Boolean);
  const hasPhoto = !!f.heroPhotoUrl;

  const projectsHtml = projects.filter(p => p.name).map(p =>
    `<div class="project-card">
      <div class="project-info">
        <span class="project-category">Project</span>
        <h3>${esc(p.name)}</h3>
        ${p.description ? `<p>${esc(p.description)}</p>` : ""}
        ${p.techStack ? `<div class="tech-stack">${p.techStack.split(",").map(t => `<span>${esc(t.trim())}</span>`).join("")}</div>` : ""}
        ${p.link ? `<a href="${esc(p.link)}" class="project-link" target="_blank">Lihat Detail &rarr;</a>` : ""}
      </div>
    </div>`
  ).join("") || "";

  const expHtml = experiences.filter(e => e.company || e.position).map(e =>
    `<div class="exp-item">
      <div class="exp-header"><span class="exp-title">${esc(e.position || "Posisi")}</span><span class="exp-date">${esc(e.startDate || "")}${e.startDate && e.endDate ? " — " : ""}${esc(e.endDate || (e.startDate ? "Sekarang" : ""))}</span></div>
      <div class="exp-company">${esc(e.company || "")}</div>
      ${e.description ? `<p class="exp-desc">${esc(e.description)}</p>` : ""}
    </div>`
  ).join("") || "";

  const eduHtml = educations.filter(e => e.institution || e.degree).map(e =>
    `<div class="exp-item">
      <div class="exp-header"><span class="exp-title">${esc(e.degree || "Gelar")}</span><span class="exp-date">${esc(e.startDate || "")}${e.startDate && e.endDate ? " — " : ""}${esc(e.endDate || "")}</span></div>
      <div class="exp-company">${esc(e.institution || "")}</div>
      ${e.field ? `<p class="exp-desc">${esc(e.field)}</p>` : ""}
    </div>`
  ).join("") || "";

  const testimonialHtml = testimonials.filter(t => t.name || t.testimonial).map(t =>
    `<div class="testimonial-card">
      <p class="testimonial-text">"${esc(t.testimonial || "")}"</p>
      <div class="testimonial-author"><strong>${esc(t.name || "")}</strong>${t.position ? `<span>${esc(t.position)}</span>` : ""}</div>
    </div>`
  ).join("") || "";

  const contactLinks = [
    f.contactEmail ? `<a href="mailto:${esc(f.contactEmail)}" class="contact-link">${esc(f.contactEmail)}</a>` : "",
    f.contactPhone ? `<a href="tel:${esc(f.contactPhone)}" class="contact-link">${esc(f.contactPhone)}</a>` : "",
    f.contactLinkedin ? `<a href="https://${esc(f.contactLinkedin.replace(/^https?:\/\//, ""))}" class="contact-link" target="_blank">LinkedIn</a>` : "",
    f.contactGithub ? `<a href="https://${esc(f.contactGithub.replace(/^https?:\/\//, ""))}" class="contact-link" target="_blank">GitHub</a>` : "",
    ...extraLinks.filter(l => l.url).map(l => `<a href="${esc(l.url)}" class="contact-link" target="_blank">${esc(l.label || "Link")}</a>`),
  ].filter(Boolean).join("");

  const statCards = [f.aboutYearsExp ? `<div class="stat-card"><span class="stat-number">${esc(f.aboutYearsExp)}</span><span class="stat-label">Tahun Pengalaman</span></div>` : "",
    f.aboutProjectsDone ? `<div class="stat-card"><span class="stat-number">${esc(f.aboutProjectsDone)}</span><span class="stat-label">Project Selesai</span></div>` : "",
    f.aboutClientsHappy ? `<div class="stat-card"><span class="stat-number">${esc(f.aboutClientsHappy)}</span><span class="stat-label">Klien Puas</span></div>` : "",
  ].filter(Boolean).join("");

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} — Portfolio</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #0B0F19; color: #F3F4F6; line-height: 1.6; overflow-x: hidden; }
    a { text-decoration: none; color: inherit; }
    img { max-width: 100%; }
    .container { max-width: 1140px; margin: 0 auto; padding: 0 24px; }
    section { padding: 80px 0; }

    /* Navbar */
    .navbar { position: fixed; top: 0; left: 0; width: 100%; background: rgba(11,15,25,0.85); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.05); z-index: 100; }
    .nav-inner { max-width: 1140px; margin: 0 auto; padding: 0 24px; display: flex; justify-content: space-between; align-items: center; height: 72px; }
    .logo { font-size: 22px; font-weight: 800; letter-spacing: -1px; }
    .logo span { color: #6366F1; }
    .nav-links { display: flex; gap: 28px; align-items: center; }
    .nav-links a { font-size: 14px; font-weight: 500; color: #9CA3AF; transition: color 0.2s; }
    .nav-links a:hover { color: #F3F4F6; }
    .nav-cta { background: rgba(255,255,255,0.06); padding: 8px 18px; border-radius: 100px; border: 1px solid rgba(255,255,255,0.1); }
    .nav-cta:hover { background: #6366F1; border-color: #6366F1; }

    /* Hero */
    .hero { padding-top: 160px; padding-bottom: 80px; }
    .hero-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; align-items: center; gap: 60px; }
    .hero-badge { display: inline-block; background: rgba(99,102,241,0.12); color: #818CF8; padding: 6px 16px; border-radius: 100px; font-size: 12px; font-weight: 600; margin-bottom: 20px; border: 1px solid rgba(99,102,241,0.2); }
    .hero h1 { font-size: 48px; font-weight: 800; line-height: 1.1; letter-spacing: -1.5px; margin-bottom: 12px; }
    .hero h1 .highlight { color: #6366F1; }
    .hero h2 { font-size: 20px; color: #9CA3AF; font-weight: 500; margin-bottom: 20px; }
    .hero p { font-size: 15px; color: #9CA3AF; max-width: 520px; margin-bottom: 32px; }
    .hero-cta { display: flex; gap: 12px; }
    .btn-primary { background: #6366F1; color: #fff; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 20px rgba(99,102,241,0.2); transition: all 0.2s; }
    .btn-primary:hover { transform: translateY(-2px); opacity: 0.92; }
    .btn-secondary { border: 1px solid rgba(255,255,255,0.12); padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; transition: background 0.2s; }
    .btn-secondary:hover { background: rgba(255,255,255,0.05); }
    .hero-image-wrap { position: relative; display: flex; justify-content: center; align-items: center; }
    .blob-bg { position: absolute; width: 300px; height: 300px; background: radial-gradient(circle, #6366F1 0%, transparent 70%); opacity: 0.3; filter: blur(50px); }
    .profile-img { width: 280px; height: 340px; object-fit: cover; border-radius: 20px; position: relative; z-index: 2; border: 1px solid rgba(255,255,255,0.1); }
    .profile-placeholder { width: 280px; height: 340px; border-radius: 20px; background: #151B2C; display: flex; align-items: center; justify-content: center; position: relative; z-index: 2; border: 1px solid rgba(255,255,255,0.08); }
    .profile-placeholder span { font-size: 80px; font-weight: 800; color: #6366F1; opacity: 0.3; }

    /* Section Headers */
    .section-header { margin-bottom: 40px; }
    .section-sub { color: #818CF8; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; margin-bottom: 8px; display: block; }
    .section-header h2 { font-size: 32px; font-weight: 700; letter-spacing: -1px; }

    /* Cards */
    .card { background: #151B2C; border-radius: 16px; padding: 28px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 16px; }
    .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 24px; }
    .stat-card { text-align: center; padding: 20px; background: rgba(99,102,241,0.08); border-radius: 12px; }
    .stat-number { font-size: 28px; font-weight: 700; color: #6366F1; display: block; }
    .stat-label { font-size: 13px; color: #9CA3AF; margin-top: 4px; }

    /* Projects Grid */
    .project-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .project-card { background: #151B2C; border-radius: 16px; padding: 24px; border: 1px solid rgba(255,255,255,0.05); transition: all 0.3s; }
    .project-card:hover { transform: translateY(-4px); border-color: rgba(99,102,241,0.3); }
    .project-category { font-size: 11px; color: #818CF8; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
    .project-card h3 { font-size: 18px; margin: 8px 0; }
    .project-card p { font-size: 14px; color: #9CA3AF; margin-bottom: 16px; }
    .tech-stack { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
    .tech-stack span { font-size: 11px; padding: 4px 10px; border-radius: 20px; background: rgba(99,102,241,0.1); color: #A5B4FC; }
    .project-link { font-size: 14px; font-weight: 600; color: #6366F1; }

    /* Experience List */
    .exp-item { margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .exp-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .exp-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 4px; margin-bottom: 4px; }
    .exp-title { font-weight: 600; font-size: 15px; }
    .exp-date { font-size: 13px; color: #9CA3AF; }
    .exp-company { color: #818CF8; font-size: 14px; font-style: italic; }
    .exp-desc { font-size: 14px; color: #9CA3AF; margin-top: 8px; }

    /* Skills */
    .skills-wrap { display: flex; flex-wrap: wrap; gap: 10px; }
    .skill-tag { padding: 10px 20px; border-radius: 100px; background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.15); font-size: 13px; font-weight: 500; color: #A5B4FC; }

    /* Testimonials */
    .testimonial-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .testimonial-card { background: #151B2C; border-radius: 16px; padding: 24px; border: 1px solid rgba(255,255,255,0.05); }
    .testimonial-text { font-size: 14px; color: #9CA3AF; font-style: italic; margin-bottom: 16px; line-height: 1.7; }
    .testimonial-author strong { display: block; font-size: 14px; }
    .testimonial-author span { font-size: 13px; color: #9CA3AF; }

    /* Contact */
    .contact-section { text-align: center; padding: 100px 0; }
    .contact-section h2 { font-size: 36px; font-weight: 700; margin-bottom: 12px; }
    .contact-section p { color: #9CA3AF; margin-bottom: 32px; }
    .contact-links { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; }
    .contact-link { padding: 10px 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); font-size: 14px; color: #9CA3AF; transition: all 0.2s; }
    .contact-link:hover { background: #6366F1; color: #fff; border-color: #6366F1; }

    /* Footer */
    .footer { text-align: center; padding: 32px 0; border-top: 1px solid rgba(255,255,255,0.05); font-size: 13px; color: #9CA3AF; }

    @media (max-width: 968px) {
      .hero-grid { grid-template-columns: 1fr; text-align: center; gap: 40px; }
      .hero p { margin: 0 auto 32px; }
      .hero-cta { justify-content: center; }
      .hero-image-wrap { order: -1; }
      .profile-img, .profile-placeholder { width: 200px; height: 240px; }
      .profile-placeholder span { font-size: 56px; }
      .nav-links a:not(.nav-cta) { display: none; }
      .stat-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <nav class="navbar">
    <div class="nav-inner">
      <a href="#" class="logo">${esc(name.split(" ")[0] || "Portfolio")}<span>.</span></a>
      <div class="nav-links">
        <a href="#about">Tentang</a>
        <a href="#projects">Proyek</a>
        <a href="#skills">Keahlian</a>
        <a href="#contact" class="nav-cta">Hubungi</a>
      </div>
    </div>
  </nav>

  <header class="hero" id="about">
    <div class="container hero-grid">
      <div class="hero-text">
        ${f.heroSubHeadline ? `<span class="hero-badge">${esc(f.heroSubHeadline)}</span>` : ""}
        <h1>Halo, Saya <span class="highlight">${name}</span></h1>
        ${f.heroHeadline ? `<h2>${esc(f.heroHeadline)}</h2>` : ""}
        ${f.heroBio ? `<p>${esc(f.heroBio)}</p>` : ""}
        <div class="hero-cta">
          <a href="#projects" class="btn-primary">Lihat Karya</a>
          <a href="#contact" class="btn-secondary">Hubungi Saya</a>
        </div>
      </div>
      <div class="hero-image-wrap">
        <div class="blob-bg"></div>
        ${hasPhoto
          ? `<img src="${esc(f.heroPhotoUrl)}" alt="${name}" class="profile-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
             <div class="profile-placeholder" style="display:none"><span>${init}</span></div>`
          : `<div class="profile-placeholder"><span>${init}</span></div>`
        }
      </div>
    </div>
  </header>

  ${f.aboutText ? `<section id="about" class="container"><div class="section-header"><span class="section-sub">Tentang Saya</span><h2>Profil Singkat</h2></div>
    <div class="card"><p style="font-size:15px;color:#9CA3AF;line-height:1.8">${esc(f.aboutText)}</p>
    ${statCards ? `<div class="stat-grid">${statCards}</div>` : ""}</div></section>` : ""}

  ${expHtml ? `<section id="experience" class="container"><div class="section-header"><span class="section-sub">Pengalaman</span><h2>Riwayat Karir</h2></div>
    <div class="card">${expHtml}</div></section>` : ""}

  ${eduHtml ? `<section id="education" class="container"><div class="section-header"><span class="section-sub">Pendidikan</span><h2>Riwayat Akademik</h2></div>
    <div class="card">${eduHtml}</div></section>` : ""}

  ${projectsHtml ? `<section id="projects" class="container"><div class="section-header"><span class="section-sub">Karya Terbaru</span><h2>Project Pilihan</h2></div>
    <div class="project-grid">${projectsHtml}</div></section>` : ""}

  ${skillTags.length > 0 || f.skillsTools || f.skillsLanguages ? `<section id="skills" class="container"><div class="section-header"><span class="section-sub">Spesialisasi</span><h2>Keahlian</h2></div>
    <div class="card">${skillTags.length > 0 ? `<div class="skills-wrap">${skillTags.map(s => `<span class="skill-tag">${esc(s)}</span>`).join("")}</div>` : ""}
    ${f.skillsTools ? `<p style="font-size:14px;color:#9CA3AF;margin-top:16px"><strong style="color:#F3F4F6">Tools:</strong> ${esc(f.skillsTools)}</p>` : ""}
    ${f.skillsLanguages ? `<p style="font-size:14px;color:#9CA3AF;margin-top:8px"><strong style="color:#F3F4F6">Bahasa:</strong> ${esc(f.skillsLanguages)}</p>` : ""}</div></section>` : ""}

  ${testimonials.filter(t => t.name || t.testimonial).length > 0 ? `<section id="testimonials" class="container"><div class="section-header"><span class="section-sub">Kata Mereka</span><h2>Testimoni</h2></div>
    <div class="testimonial-grid">${testimonialHtml}</div></section>` : ""}

  ${contactLinks ? `<section id="contact" class="contact-section container"><h2>Mari Bekerja Sama</h2>
    <p>Punya ide menarik atau butuh bantuan? Hubungi saya sekarang.</p>
    <div class="contact-links">${contactLinks}</div></section>` : ""}

  <footer class="footer">
    <p>&copy; 2026 ${name}. Dibuat dengan AI Career Hub.</p>
  </footer>
</body>
</html>`;
}

/* ──────────────── TEMPLATE 2: COLORFUL (GRADIENT THEME) ──────────────── */

export function generateColorfulHtml(
  f: PortfolioFormData, projects: ProjectItem[], experiences: ExperienceItem[],
  educations: EducationItem[], testimonials: TestimonialItem[], extraLinks: ExtraLink[]
): string {
  const name = esc(fullName(f));
  const init = esc(initials(f));
  const skillTags = f.skillsMain.split(",").map(s => s.trim()).filter(Boolean);
  const hasPhoto = !!f.heroPhotoUrl;

  const projectsHtml = projects.filter(p => p.name).map(p =>
    `<div class="project-card">
      <div class="project-card-info">
        <h3>${esc(p.name)}</h3>
        ${p.description ? `<p>${esc(p.description)}</p>` : ""}
        ${p.techStack ? `<div class="tech-stack">${p.techStack.split(",").map(t => `<span>${esc(t.trim())}</span>`).join("")}</div>` : ""}
        ${p.link ? `<a href="${esc(p.link)}" class="btn-text-colorful" target="_blank">Detail &rarr;</a>` : ""}
      </div>
    </div>`
  ).join("") || "";

  const expHtml = experiences.filter(e => e.company || e.position).map(e =>
    `<div class="exp-item">
      <div class="exp-header"><span class="exp-title">${esc(e.position || "Posisi")}</span><span class="exp-date">${esc(e.startDate || "")}${e.startDate && e.endDate ? " — " : ""}${esc(e.endDate || (e.startDate ? "Sekarang" : ""))}</span></div>
      <div class="exp-company">${esc(e.company || "")}</div>
      ${e.description ? `<p class="exp-desc">${esc(e.description)}</p>` : ""}
    </div>`
  ).join("") || "";

  const eduHtml = educations.filter(e => e.institution || e.degree).map(e =>
    `<div class="exp-item">
      <div class="exp-header"><span class="exp-title">${esc(e.degree || "Gelar")}</span><span class="exp-date">${esc(e.startDate || "")}${e.startDate && e.endDate ? " — " : ""}${esc(e.endDate || "")}</span></div>
      <div class="exp-company">${esc(e.institution || "")}${e.field ? ` &middot; ${esc(e.field)}` : ""}</div>
    </div>`
  ).join("") || "";

  const testimonialHtml = testimonials.filter(t => t.name || t.testimonial).map(t =>
    `<div class="testimonial-card">
      <p class="testimonial-text">"${esc(t.testimonial || "")}"</p>
      <div class="testimonial-author"><strong>${esc(t.name || "")}</strong>${t.position ? `<span>${esc(t.position)}</span>` : ""}</div>
    </div>`
  ).join("") || "";

  const contactLinks = [
    f.contactEmail ? `<a href="mailto:${esc(f.contactEmail)}" class="contact-link">Email</a>` : "",
    f.contactPhone ? `<a href="tel:${esc(f.contactPhone)}" class="contact-link">Telepon</a>` : "",
    f.contactLinkedin ? `<a href="https://${esc(f.contactLinkedin.replace(/^https?:\/\//, ""))}" class="contact-link" target="_blank">LinkedIn</a>` : "",
    f.contactGithub ? `<a href="https://${esc(f.contactGithub.replace(/^https?:\/\//, ""))}" class="contact-link" target="_blank">GitHub</a>` : "",
    ...extraLinks.filter(l => l.url).map(l => `<a href="${esc(l.url)}" class="contact-link" target="_blank">${esc(l.label || "Link")}</a>`),
  ].filter(Boolean).join("");

  const statCards = [f.aboutYearsExp ? `<div class="stat-card"><span class="stat-number">${esc(f.aboutYearsExp)}</span><span class="stat-label">Tahun Pengalaman</span></div>` : "",
    f.aboutProjectsDone ? `<div class="stat-card"><span class="stat-number">${esc(f.aboutProjectsDone)}</span><span class="stat-label">Project Selesai</span></div>` : "",
    f.aboutClientsHappy ? `<div class="stat-card"><span class="stat-number">${esc(f.aboutClientsHappy)}</span><span class="stat-label">Klien Puas</span></div>` : "",
  ].filter(Boolean).join("");

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} — Portfolio</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --grad-p-to-b: linear-gradient(135deg, #FF6B6B 0%, #355C7D 100%);
      --grad-y-to-p: linear-gradient(135deg, #FF9933 0%, #FFCC00 100%);
      --grad-m-to-p: linear-gradient(135deg, #D93B80 0%, #FFCB77 100%);
      --grad-accent-1: linear-gradient(135deg, #FF9933 0%, #FFCC00 100%);
      --grad-accent-2: linear-gradient(135deg, #D93B80 0%, #2D9CDB 100%);
      --color-dark: #1A1D2D;
      --color-light: #F2F4F7;
      --color-grey: #666E81;
      --color-white: #FFFFFF;
      --font-main: 'Montserrat', sans-serif;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: var(--font-main); color: var(--color-dark); background: #F8F9FF; line-height: 1.6; overflow-x: hidden; }
    a { text-decoration: none; color: inherit; }
    img { max-width: 100%; }
    .container { max-width: 1100px; margin: 0 auto; padding: 0 20px; width: 100%; }
    section { padding: 80px 0; }
    h1, h2, h3 { font-weight: 800; line-height: 1.2; letter-spacing: -1px; }

    /* Top Gradient BG */
    .top-bg { position: absolute; top: 0; left: 0; width: 100%; height: 500px; background: var(--grad-p-to-b); z-index: -1; opacity: 0.08; }

    /* Navbar */
    .navbar { position: absolute; top: 0; left: 0; width: 100%; z-index: 10; padding: 20px 0; }
    .nav-inner { max-width: 1100px; margin: 0 auto; padding: 0 20px; display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 28px; font-weight: 800; color: #FF6B6B; }
    .nav-links { display: flex; gap: 28px; align-items: center; }
    .nav-links a { font-size: 14px; font-weight: 600; color: var(--color-dark); transition: opacity 0.2s; }
    .nav-links a:hover { opacity: 0.7; }
    .btn-sm-colorful { padding: 8px 20px; border-radius: 100px; background: var(--grad-accent-2); color: white; font-weight: 600; font-size: 13px; box-shadow: 0 4px 12px rgba(217,59,128,0.25); }

    /* Hero */
    .hero { padding-top: 150px; padding-bottom: 80px; }
    .hero-grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 60px; align-items: center; }
    .intro-badge { display: inline-block; padding: 6px 16px; border-radius: 100px; background: var(--grad-m-to-p); color: white; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-bottom: 16px; }
    .hero h1 { font-size: 52px; margin-bottom: 12px; letter-spacing: -2px; }
    .colorful-text { background: var(--grad-accent-2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .hero p { font-size: 15px; color: var(--color-grey); margin-bottom: 24px; max-width: 480px; line-height: 1.8; }
    .hero-cta { display: flex; gap: 12px; }
    .btn-colorful { display: inline-block; padding: 12px 28px; border-radius: 100px; color: white; font-weight: 600; font-size: 14px; background: var(--grad-accent-1); box-shadow: 0 4px 16px rgba(255,107,107,0.25); transition: all 0.2s; }
    .btn-colorful:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(255,107,107,0.35); }
    .hero-image-wrap { position: relative; display: flex; justify-content: center; align-items: center; }
    .color-circle-1 { position: absolute; width: 400px; height: 400px; border-radius: 50%; background: var(--grad-p-to-b); opacity: 0.2; z-index: -1; transform: translate(-40px, 20px); }
    .color-circle-2 { position: absolute; width: 340px; height: 340px; border-radius: 50%; background: var(--grad-y-to-p); opacity: 0.15; z-index: -2; transform: translate(50px, -40px); }
    .profile-img { width: 280px; height: 280px; object-fit: cover; border-radius: 50%; border: 6px solid white; position: relative; z-index: 1; box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
    .profile-placeholder { width: 280px; height: 280px; border-radius: 50%; background: #FFE8E8; display: flex; align-items: center; justify-content: center; border: 6px solid white; box-shadow: 0 8px 24px rgba(0,0,0,0.1); position: relative; z-index: 1; }
    .profile-placeholder span { font-size: 80px; font-weight: 800; color: #FF6B6B; opacity: 0.4; }

    /* Section Headers */
    .section-sub { color: #FF6B6B; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; margin-bottom: 8px; display: block; }
    .section-header h2 { font-size: 34px; margin-bottom: 8px; position: relative; display: inline-block; }
    .section-header h2::after { content: ''; position: absolute; left: 0; bottom: -4px; width: 100%; height: 4px; border-radius: 10px; background: var(--grad-p-to-b); }

    /* Card */
    .card { background: white; border-radius: 20px; padding: 28px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.04); margin-bottom: 16px; }
    .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 24px; }
    .stat-card { text-align: center; padding: 20px; background: #FFF0F0; border-radius: 12px; }
    .stat-number { font-size: 28px; font-weight: 800; color: #FF6B6B; display: block; }
    .stat-label { font-size: 13px; color: var(--color-grey); margin-top: 4px; }

    /* Projects */
    .project-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .project-card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.04); transition: transform 0.3s; }
    .project-card:hover { transform: translateY(-4px); }
    .project-card h3 { font-size: 18px; margin-bottom: 8px; }
    .project-card p { font-size: 14px; color: var(--color-grey); margin-bottom: 16px; }
    .tech-stack { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
    .tech-stack span { font-size: 11px; padding: 4px 10px; border-radius: 20px; background: #FFF0F0; color: #D93B80; font-weight: 600; }
    .btn-text-colorful { background: var(--grad-p-to-b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-weight: 700; font-size: 14px; }

    /* Experience */
    .exp-item { margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid rgba(0,0,0,0.06); }
    .exp-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .exp-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 4px; margin-bottom: 4px; }
    .exp-title { font-weight: 700; font-size: 15px; }
    .exp-date { font-size: 13px; color: var(--color-grey); }
    .exp-company { color: #D93B80; font-size: 14px; font-style: italic; }
    .exp-desc { font-size: 14px; color: var(--color-grey); margin-top: 8px; }

    /* Skills */
    .skills-wrap { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
    .skill-tag { padding: 10px 22px; border-radius: 100px; background: var(--color-light); font-weight: 600; font-size: 14px; color: var(--color-dark); }

    /* Testimonials */
    .testimonial-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .testimonial-card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.04); }
    .testimonial-text { font-size: 14px; color: var(--color-grey); font-style: italic; margin-bottom: 16px; line-height: 1.7; }
    .testimonial-author strong { display: block; font-size: 14px; }
    .testimonial-author span { font-size: 13px; color: var(--color-grey); }

    /* Contact */
    .contact-section { text-align: center; }
    .contact-box { background: white; padding: 60px; border-radius: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.06); border: 1px solid rgba(255,107,107,0.1); max-width: 720px; margin: 0 auto; }
    .contact-box h2 { font-size: 32px; margin-bottom: 12px; }
    .contact-box p { color: var(--color-grey); margin-bottom: 28px; font-size: 15px; }
    .contact-links { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 28px; }
    .contact-link { font-size: 14px; font-weight: 600; color: var(--color-grey); padding: 8px 16px; border-radius: 8px; transition: all 0.2s; }
    .contact-link:hover { color: #FF6B6B; background: #FFF0F0; }

    /* Footer */
    .footer { text-align: center; padding: 32px 0; font-size: 13px; color: var(--color-grey); }

    @media (max-width: 992px) {
      .hero-grid { grid-template-columns: 1fr; text-align: center; gap: 40px; }
      .hero p { margin: 0 auto 24px; }
      .hero-cta, .nav-links { justify-content: center; }
      .hero-image-wrap { order: -1; }
      .profile-img, .profile-placeholder { width: 200px; height: 200px; }
      .profile-placeholder span { font-size: 56px; }
      .color-circle-1, .color-circle-2 { display: none; }
      .hero h1 { font-size: 36px; }
      .nav-links a:not(.btn-sm-colorful) { display: none; }
      .stat-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="top-bg"></div>

  <nav class="navbar">
    <div class="nav-inner">
      <a href="#" class="logo">${esc(name[0] || "P")}.</a>
      <div class="nav-links">
        <a href="#about">Tentang</a>
        <a href="#projects">Proyek</a>
        <a href="#skills">Keahlian</a>
        <a href="#contact" class="btn-sm-colorful">Hubungi</a>
      </div>
    </div>
  </nav>

  <section class="hero" id="about">
    <div class="container hero-grid">
      <div class="hero-text">
        ${f.heroSubHeadline ? `<span class="intro-badge">${esc(f.heroSubHeadline)}</span>` : ""}
        <h1>Halo! Saya <span class="colorful-text">${name}</span></h1>
        ${f.heroHeadline ? `<p>${esc(f.heroHeadline)}</p>` : ""}
        ${f.heroBio ? `<p>${esc(f.heroBio)}</p>` : ""}
        <div class="hero-cta">
          <a href="#projects" class="btn-colorful">Lihat Karya</a>
        </div>
      </div>
      <div class="hero-image-wrap">
        <div class="color-circle-1"></div>
        <div class="color-circle-2"></div>
        ${hasPhoto
          ? `<img src="${esc(f.heroPhotoUrl)}" alt="${name}" class="profile-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
             <div class="profile-placeholder" style="display:none"><span>${init}</span></div>`
          : `<div class="profile-placeholder"><span>${init}</span></div>`
        }
      </div>
    </div>
  </section>

  ${f.aboutText ? `<section id="about" class="container"><div class="section-header"><span class="section-sub">Tentang Saya</span><h2>Profil Singkat</h2></div>
    <div class="card"><p style="font-size:15px;color:#666E81;line-height:1.8">${esc(f.aboutText)}</p>
    ${statCards ? `<div class="stat-grid">${statCards}</div>` : ""}</div></section>` : ""}

  ${expHtml ? `<section id="experience" class="container"><div class="section-header"><span class="section-sub">Karir</span><h2>Pengalaman Kerja</h2></div>
    <div class="card">${expHtml}</div></section>` : ""}

  ${eduHtml ? `<section id="education" class="container"><div class="section-header"><span class="section-sub">Akademik</span><h2>Pendidikan</h2></div>
    <div class="card">${eduHtml}</div></section>` : ""}

  ${projectsHtml ? `<section id="projects" class="container"><div class="section-header"><span class="section-sub">Karya Terbaru</span><h2>Project Unggulan</h2></div>
    <div class="project-grid">${projectsHtml}</div></section>` : ""}

  ${skillTags.length > 0 || f.skillsTools || f.skillsLanguages ? `<section id="skills" class="container"><div class="section-header"><span class="section-sub">Spesialisasi</span><h2>Keahlian Saya</h2></div>
    <div class="card" style="text-align:center">${skillTags.length > 0 ? `<div class="skills-wrap">${skillTags.map(s => `<span class="skill-tag">${esc(s)}</span>`).join("")}</div>` : ""}
    ${f.skillsTools ? `<p style="font-size:14px;color:#666E81;margin-top:16px"><strong style="color:#1A1D2D">Tools:</strong> ${esc(f.skillsTools)}</p>` : ""}
    ${f.skillsLanguages ? `<p style="font-size:14px;color:#666E81;margin-top:8px"><strong style="color:#1A1D2D">Bahasa:</strong> ${esc(f.skillsLanguages)}</p>` : ""}</div></section>` : ""}

  ${testimonials.filter(t => t.name || t.testimonial).length > 0 ? `<section id="testimonials" class="container"><div class="section-header"><span class="section-sub">Kata Mereka</span><h2>Testimoni</h2></div>
    <div class="testimonial-grid">${testimonialHtml}</div></section>` : ""}

  ${contactLinks ? `<section id="contact" class="contact-section container"><div class="contact-box"><h2>Mari Bekerja Sama!</h2>
    <p>Punya ide seru? Hubungi saya untuk diskusi lebih lanjut.</p>
    <a href="mailto:${esc(f.contactEmail || "")}" class="btn-colorful" style="display:inline-block">Kirim Email</a>
    <div class="contact-links">${contactLinks}</div></div></section>` : ""}

  <footer class="footer">
    <p>&copy; 2026 ${name}. Dibuat dengan AI Career Hub.</p>
  </footer>
</body>
</html>`;
}

/* ──────────────── TEMPLATE 3: MODERN (CLEAN PROFESSIONAL) ──────────────── */

export function generateModernHtml(
  f: PortfolioFormData, projects: ProjectItem[], experiences: ExperienceItem[],
  educations: EducationItem[], testimonials: TestimonialItem[], extraLinks: ExtraLink[]
): string {
  const name = esc(fullName(f));
  const init = esc(initials(f));
  const skillTags = f.skillsMain.split(",").map(s => s.trim()).filter(Boolean);
  const hasPhoto = !!f.heroPhotoUrl;

  const projectsHtml = projects.filter(p => p.name).map(p =>
    `<div class="project-card">
      <div class="project-card-body">
        <h3>${esc(p.name)}</h3>
        ${p.description ? `<p>${esc(p.description)}</p>` : ""}
        ${p.techStack ? `<div class="tags">${p.techStack.split(",").map(t => `<span class="tag">${esc(t.trim())}</span>`).join("")}</div>` : ""}
        ${p.link ? `<a href="${esc(p.link)}" class="project-link" target="_blank">Buka Project</a>` : ""}
      </div>
    </div>`
  ).join("") || "";

  const expHtml = experiences.filter(e => e.company || e.position).map(e =>
    `<div class="list-item">
      <div class="list-header"><span class="list-title">${esc(e.position || "Posisi")}</span><span class="list-date">${esc(e.startDate || "")}${e.startDate && e.endDate ? " — " : ""}${esc(e.endDate || (e.startDate ? "Sekarang" : ""))}</span></div>
      <div class="list-sub">${esc(e.company || "")}</div>
      ${e.description ? `<p class="list-desc">${esc(e.description)}</p>` : ""}
    </div>`
  ).join("") || "";

  const eduHtml = educations.filter(e => e.institution || e.degree).map(e =>
    `<div class="list-item">
      <div class="list-header"><span class="list-title">${esc(e.degree || "Gelar")}</span><span class="list-date">${esc(e.startDate || "")}${e.startDate && e.endDate ? " — " : ""}${esc(e.endDate || "")}</span></div>
      <div class="list-sub">${esc(e.institution || "")}</div>
      ${e.field ? `<p class="list-desc">${esc(e.field)}</p>` : ""}
    </div>`
  ).join("") || "";

  const testimonialHtml = testimonials.filter(t => t.name || t.testimonial).map(t =>
    `<div class="testimonial-card">
      <div class="testimonial-text">"${esc(t.testimonial || "")}"</div>
      <div class="testimonial-author"><strong>${esc(t.name || "")}</strong>${t.position ? `<span>${esc(t.position)}</span>` : ""}</div>
    </div>`
  ).join("") || "";

  const contactItems = [
    f.contactEmail ? `<a href="mailto:${esc(f.contactEmail)}" class="contact-btn">${esc(f.contactEmail)}</a>` : "",
    f.contactPhone ? `<a href="tel:${esc(f.contactPhone)}" class="contact-btn">${esc(f.contactPhone)}</a>` : "",
    f.contactLinkedin ? `<a href="https://${esc(f.contactLinkedin.replace(/^https?:\/\//, ""))}" class="contact-btn" target="_blank">LinkedIn</a>` : "",
    f.contactGithub ? `<a href="https://${esc(f.contactGithub.replace(/^https?:\/\//, ""))}" class="contact-btn" target="_blank">GitHub</a>` : "",
    ...extraLinks.filter(l => l.url).map(l => `<a href="${esc(l.url)}" class="contact-btn" target="_blank">${esc(l.label || "Link")}</a>`),
  ].filter(Boolean).join("");

  const statCards = [f.aboutYearsExp ? `<div class="stat"><div class="stat-num">${esc(f.aboutYearsExp)}</div><div class="stat-label">Tahun</div></div>` : "",
    f.aboutProjectsDone ? `<div class="stat"><div class="stat-num">${esc(f.aboutProjectsDone)}</div><div class="stat-label">Project</div></div>` : "",
    f.aboutClientsHappy ? `<div class="stat"><div class="stat-num">${esc(f.aboutClientsHappy)}</div><div class="stat-label">Klien</div></div>` : "",
  ].filter(Boolean).join("");

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} — Portfolio</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif; background: #FBF8FE; color: #1B1B1F; line-height: 1.6; }
    a { text-decoration: none; color: inherit; }
    img { max-width: 100%; }
    .container { max-width: 960px; margin: 0 auto; padding: 0 24px; }
    section { padding: 64px 0; }

    /* Navbar */
    .navbar { position: sticky; top: 0; background: rgba(251,248,254,0.9); backdrop-filter: blur(8px); border-bottom: 1px solid rgba(0,0,0,0.04); z-index: 50; }
    .nav-inner { max-width: 960px; margin: 0 auto; padding: 0 24px; display: flex; justify-content: space-between; align-items: center; height: 64px; }
    .nav-name { font-weight: 700; font-size: 16px; color: #6C45B2; }
    .nav-links { display: flex; gap: 24px; align-items: center; }
    .nav-links a { font-size: 13px; font-weight: 500; color: #4A4452; transition: color 0.2s; }
    .nav-links a:hover { color: #6C45B2; }

    /* Hero */
    .hero { padding-top: 80px; text-align: center; }
    .hero-avatar { margin: 0 auto 24px; width: 120px; height: 120px; border-radius: 50%; overflow: hidden; border: 4px solid white; box-shadow: 0 4px 16px rgba(108,69,178,0.12); }
    .hero-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .hero-avatar-placeholder { width: 120px; height: 120px; border-radius: 50%; background: #E8DFF5; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; border: 4px solid white; box-shadow: 0 4px 16px rgba(108,69,178,0.12); }
    .hero-avatar-placeholder span { font-size: 40px; font-weight: 700; color: #6C45B2; opacity: 0.4; }
    .hero h1 { font-size: 40px; font-weight: 800; letter-spacing: -1px; margin-bottom: 8px; }
    .hero .subtitle { font-size: 18px; color: #6C45B2; font-weight: 600; margin-bottom: 8px; }
    .hero .headline { font-size: 15px; color: #4A4452; margin-bottom: 16px; }
    .hero .bio { font-size: 15px; color: #4A4452; max-width: 600px; margin: 0 auto 24px; line-height: 1.7; }
    .hero-cta { display: flex; justify-content: center; gap: 12px; }
    .btn-primary { background: #6C45B2; color: white; padding: 10px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; transition: all 0.2s; }
    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-secondary { border: 1px solid rgba(0,0,0,0.1); padding: 10px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; transition: all 0.2s; }
    .btn-secondary:hover { background: rgba(0,0,0,0.02); }

    /* Section Headers */
    .section-title { font-size: 22px; font-weight: 700; margin-bottom: 24px; display: flex; align-items: center; gap: 8px; color: #1B1B1F; }
    .section-title::before { content: ''; display: inline-block; width: 4px; height: 24px; background: #6C45B2; border-radius: 4px; }

    /* Cards */
    .card { background: white; border-radius: 16px; padding: 28px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.04); margin-bottom: 16px; }
    .card-text { font-size: 15px; color: #4A4452; line-height: 1.8; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 24px; }
    .stat { text-align: center; padding: 16px; background: #F5F0FF; border-radius: 12px; }
    .stat-num { font-size: 24px; font-weight: 700; color: #6C45B2; }
    .stat-label { font-size: 13px; color: #4A4452; margin-top: 4px; }

    /* List Items */
    .list-item { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid rgba(0,0,0,0.04); }
    .list-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .list-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 4px; margin-bottom: 4px; }
    .list-title { font-weight: 600; font-size: 15px; }
    .list-date { font-size: 13px; color: #938F99; }
    .list-sub { color: #6C45B2; font-size: 14px; margin-bottom: 8px; }
    .list-desc { font-size: 14px; color: #4A4452; }

    /* Project Grid */
    .project-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .project-card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.04); transition: all 0.2s; }
    .project-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(108,69,178,0.08); }
    .project-card-body { padding: 24px; }
    .project-card h3 { font-size: 17px; font-weight: 700; margin-bottom: 8px; }
    .project-card p { font-size: 14px; color: #4A4452; margin-bottom: 16px; line-height: 1.6; }
    .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
    .tag { font-size: 11px; padding: 4px 10px; border-radius: 20px; background: #F0ECF9; color: #6C45B2; font-weight: 500; }
    .project-link { font-size: 13px; font-weight: 600; color: #6C45B2; }

    /* Skills */
    .skills-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .skill-chip { padding: 8px 16px; border-radius: 8px; background: #F5F0FF; border: 1px solid rgba(108,69,178,0.1); font-size: 14px; color: #1B1B1F; }

    /* Testimonials */
    .testimonial-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .testimonial-card { background: white; border-radius: 16px; padding: 24px; border: 1px solid rgba(0,0,0,0.04); }
    .testimonial-text { font-size: 14px; color: #4A4452; font-style: italic; margin-bottom: 16px; line-height: 1.7; }
    .testimonial-author strong { display: block; font-size: 14px; }
    .testimonial-author span { font-size: 13px; color: #938F99; }

    /* Contact */
    .contact-section { text-align: center; }
    .contact-wrap { background: white; border-radius: 16px; padding: 40px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.04); }
    .contact-wrap h2 { font-size: 24px; margin-bottom: 8px; }
    .contact-wrap p { color: #4A4452; margin-bottom: 24px; font-size: 15px; }
    .contact-btns { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
    .contact-btn { padding: 8px 18px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.06); font-size: 14px; color: #1B1B1F; transition: all 0.2s; }
    .contact-btn:hover { background: #F5F0FF; border-color: rgba(108,69,178,0.2); color: #6C45B2; }

    /* Footer */
    .footer { text-align: center; padding: 32px 0; font-size: 13px; color: #938F99; border-top: 1px solid rgba(0,0,0,0.04); }

    @media (max-width: 768px) {
      .nav-links a:not(.nav-name) { display: none; }
      .hero h1 { font-size: 28px; }
      .stats { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <nav class="navbar">
    <div class="nav-inner">
      <span class="nav-name">${name}</span>
      <div class="nav-links">
        <a href="#about">Tentang</a>
        <a href="#projects">Proyek</a>
        <a href="#skills">Keahlian</a>
        <a href="#contact">Kontak</a>
      </div>
    </div>
  </nav>

  <header class="hero container" id="about">
    ${hasPhoto
      ? `<div class="hero-avatar"><img src="${esc(f.heroPhotoUrl)}" alt="${name}" onerror="this.style.display='none';this.parentElement.className='hero-avatar-placeholder'" /></div>`
      : `<div class="hero-avatar-placeholder"><span>${init}</span></div>`
    }
    <h1>${name}</h1>
    ${f.heroSubHeadline ? `<p class="subtitle">${esc(f.heroSubHeadline)}</p>` : ""}
    ${f.heroHeadline ? `<p class="headline">${esc(f.heroHeadline)}</p>` : ""}
    ${f.heroBio ? `<p class="bio">${esc(f.heroBio)}</p>` : ""}
    <div class="hero-cta">
      <a href="#projects" class="btn-primary">Lihat Project</a>
      <a href="#contact" class="btn-secondary">Hubungi Saya</a>
    </div>
  </header>

  ${f.aboutText ? `<section class="container"><h2 class="section-title">Tentang Saya</h2><div class="card"><p class="card-text">${esc(f.aboutText)}</p>
    ${statCards ? `<div class="stats">${statCards}</div>` : ""}</div></section>` : ""}

  ${expHtml ? `<section class="container"><h2 class="section-title">Pengalaman Kerja</h2><div class="card">${expHtml}</div></section>` : ""}

  ${eduHtml ? `<section class="container"><h2 class="section-title">Pendidikan</h2><div class="card">${eduHtml}</div></section>` : ""}

  ${projectsHtml ? `<section id="projects" class="container"><h2 class="section-title">Project</h2><div class="project-grid">${projectsHtml}</div></section>` : ""}

  ${skillTags.length > 0 || f.skillsTools || f.skillsLanguages ? `<section id="skills" class="container"><h2 class="section-title">Keahlian</h2><div class="card">
    ${skillTags.length > 0 ? `<div class="skills-grid">${skillTags.map(s => `<span class="skill-chip">${esc(s)}</span>`).join("")}</div>` : ""}
    ${f.skillsTools ? `<p style="font-size:14px;color:#4A4452;margin-top:16px"><strong>Tools:</strong> ${esc(f.skillsTools)}</p>` : ""}
    ${f.skillsLanguages ? `<p style="font-size:14px;color:#4A4452;margin-top:8px"><strong>Bahasa:</strong> ${esc(f.skillsLanguages)}</p>` : ""}
  </div></section>` : ""}

  ${testimonials.filter(t => t.name || t.testimonial).length > 0 ? `<section id="testimonials" class="container"><h2 class="section-title">Testimoni</h2><div class="testimonial-grid">${testimonialHtml}</div></section>` : ""}

  ${contactItems ? `<section id="contact" class="container contact-section"><div class="contact-wrap"><h2>Hubungi Saya</h2>
    <p>Punya pertanyaan atau ingin bekerja sama? Jangan ragu untuk menghubungi.</p>
    <div class="contact-btns">${contactItems}</div></div></section>` : ""}

  <footer class="footer">
    <p>&copy; 2026 ${name}. Dibuat dengan AI Career Hub.</p>
  </footer>
</body>
</html>`;
}
