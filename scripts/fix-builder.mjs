import fs from 'fs';

const filePath = 'src/app/builder/[id]/page.tsx';
let c = fs.readFileSync(filePath, 'utf8');

/* ====================================================================
   CHANGE 1: Re-order steps — Target Pekerjaan moves to position 2
   ==================================================================== */

// 1a. Steps array
c = c.replace(
  `const steps = [\n  "Data Pribadi",\n  "Pengalaman Kerja",\n  "Pendidikan",\n  "Organisasi",\n  "Skill & Lainnya",\n  "Target Pekerjaan",\n  "Review",\n];`,
  `const steps = [\n  "Data Pribadi",\n  "Target Pekerjaan",\n  "Pengalaman Kerja",\n  "Pendidikan",\n  "Organisasi",\n  "Skill & Lainnya",\n  "Review",\n];`
);

// 1b. sectionCompletion mapping — reorder completion checks
c = c.replace(
  `      // 0: Data Pribadi — nama WAJIB + (email atau phone)\n      !!cvData.fullName && (!!cvData.email || !!cvData.phone),\n      // 1: Pengalaman Kerja — minimal 1 entry dengan posisi\n      cvData.workHistory.some(w => !!w.position || !!w.company),\n      // 2: Pendidikan — minimal 1 entry\n      cvData.education.some(e => !!e.institution || !!e.degree),\n      // 3: Organisasi — minimal 1 entry\n      cvData.organisations.some(o => !!o.name),\n      // 4: Skill — minimal 1 skill terisi\n      cvData.skills.some(s => !!s.name),\n      // 5: Target Pekerjaan — jobTitle atau jobDescription terisi\n      !!cvData.jobTitle || !!cvData.jobDescription,`,
  `      // 0: Data Pribadi — nama WAJIB + (email atau phone)\n      !!cvData.fullName && (!!cvData.email || !!cvData.phone),\n      // 1: Target Pekerjaan — jobTitle atau jobDescription terisi\n      !!cvData.jobTitle || !!cvData.jobDescription,\n      // 2: Pengalaman Kerja — minimal 1 entry dengan posisi\n      cvData.workHistory.some(w => !!w.position || !!w.company),\n      // 3: Pendidikan — minimal 1 entry\n      cvData.education.some(e => !!e.institution || !!e.degree),\n      // 4: Organisasi — minimal 1 entry\n      cvData.organisations.some(o => !!o.name),\n      // 5: Skill — minimal 1 skill terisi\n      cvData.skills.some(s => !!s.name),`
);

// 1c. sectionMeta array
c = c.replace(
  `  const sectionMeta = [\n    { title: "Data Pribadi", desc: "Lengkapi informasi diri kamu untuk memulai CV.", icon: "person" },\n    { title: "Pengalaman Kerja", desc: "Cantumkan riwayat pekerjaan yang relevan.", icon: "work" },\n    { title: "Pendidikan", desc: "Tambahkan latar belakang pendidikan formal kamu.", icon: "school" },\n    { title: "Organisasi", desc: "Masukkan pengalaman organisasi atau kepanitiaan.", icon: "groups" },\n    { title: "Skill & Lainnya", desc: "Tuliskan keahlian, sertifikasi, dan bahasa yang dikuasai.", icon: "star" },\n    { title: "Target Pekerjaan", desc: "Masukkan posisi yang dilamar dan deskripsi pekerjaan.", icon: "work_history" },\n    { title: "Review", desc: "Periksa kembali data CV sebelum menyimpan.", icon: "visibility" },\n  ];`,
  `  const sectionMeta = [\n    { title: "Data Pribadi", desc: "Lengkapi informasi diri kamu untuk memulai CV.", icon: "person" },\n    { title: "Target Pekerjaan", desc: "Masukkan posisi yang dilamar dan deskripsi pekerjaan agar AI bisa menyesuaikan konten CV-mu sejak awal.", icon: "work_history" },\n    { title: "Pengalaman Kerja", desc: "Cantumkan riwayat pekerjaan yang relevan.", icon: "work" },\n    { title: "Pendidikan", desc: "Tambahkan latar belakang pendidikan formal kamu.", icon: "school" },\n    { title: "Organisasi", desc: "Masukkan pengalaman organisasi atau kepanitiaan.", icon: "groups" },\n    { title: "Skill & Lainnya", desc: "Tuliskan keahlian, sertifikasi, dan bahasa yang dikuasai.", icon: "star" },\n    { title: "Review", desc: "Periksa kembali data CV sebelum menyimpan.", icon: "visibility" },\n  ];`
);

// 1d. Move activeStep === 5 (Target Pekerjaan) to activeStep === 1
c = c.replace(
  `{activeStep === 5 && (\n                <div className="bg-white rounded-xl p-6 shadow-soft space-y-5">\n                  <div className="flex items-start gap-3 pb-5 border-b border-outline-variant/20">\n                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">\n                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>work_history</span>\n                    </div>\n                    <div>\n                      <h3 className="font-headline-md text-[18px] text-on-surface">Posisi yang Dilamar</h3>\n                      <p className="text-body-md text-on-surface-variant mt-0.5">Masukkan posisi target dan deskripsi pekerjaan agar AI bisa menyesuaikan konten CV-mu.</p>\n                    </div>\n                  </div>\n                  <Field label="Judul Posisi" value={cvData.jobTitle} onChange={(v) => updateField("jobTitle", v)} />`,
  `{activeStep === 1 && (\n                <div className="bg-white rounded-xl p-6 shadow-soft space-y-5">\n                  <div className="flex items-start gap-3 pb-5 border-b border-outline-variant/20">\n                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">\n                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>work_history</span>\n                    </div>\n                    <div>\n                      <h3 className="font-headline-md text-[18px] text-on-surface">Posisi yang Dilamar</h3>\n                      <p className="text-body-md text-on-surface-variant mt-0.5">Masukkan posisi target dan deskripsi pekerjaan agar AI bisa menyesuaikan konten CV-mu sejak awal.</p>\n                    </div>\n                  </div>\n                  <Field label="Judul Posisi" value={cvData.jobTitle} onChange={(v) => updateField("jobTitle", v)} />`
);

// 1e. Move old Pengalaman Kerja (activeStep === 1) to activeStep === 2
c = c.replace(
  `{activeStep === 1 && (\n                <div className="space-y-4">\n                  {cvData.workHistory.map((work, i) => {`,
  `{activeStep === 2 && (\n                <div className="space-y-4">\n                  {cvData.workHistory.map((work, i) => {`
);

// 1f. Move old Pendidikan (activeStep === 2) to activeStep === 3
c = c.replace(
  `{activeStep === 2 && (\n                <div className="space-y-4">\n                  {cvData.education.map((edu, i) => (`,
  `{activeStep === 3 && (\n                <div className="space-y-4">\n                  {cvData.education.map((edu, i) => (`
);

// 1g. Move old Organisasi (activeStep === 3) to activeStep === 4
c = c.replace(
  `{activeStep === 3 && (\n                <div className="space-y-4">\n                  {cvData.organisations.map((org, i) => (`,
  `{activeStep === 4 && (\n                <div className="space-y-4">\n                  {cvData.organisations.map((org, i) => (`
);

// 1h. Move old Skill & Lainnya (activeStep === 4) to activeStep === 5
c = c.replace(
  `{activeStep === 4 && (\n                <div className="space-y-3">\n                  {cvData.skills.map((skill, i) => (`,
  `{activeStep === 5 && (\n                <div className="space-y-3">\n                  {cvData.skills.map((skill, i) => (`
);

// 1i. Move old Review (activeStep === 6) stays at 6 - no change needed

/* ====================================================================
   CHANGE 2: Remove Language field from Step 0 (Data Pribadi)
   ==================================================================== */

// Remove the entire Bahasa CV div block
c = c.replace(
  /\/\* CV Language \*\/\s*\n\s*<div>\s*\n\s*<label className="block text-label-bold text-on-surface mb-1\.5">Bahasa CV<\/label>\s*\n\s*<div className="flex gap-2">\s*\n\s*<button[\s\S]*?Sampai Sekarang<\/span>\s*\n\s*<\/label>[\s\S]*?<\/div>\s*\n\s*<div>/, 
  `{/* Ringkasan Profesional */}\n                  <div>`
);

// Actually easier approach: remove the CV Language section by matching it specifically
// Let me check what the code looks like more carefully

console.log('=== CHANGE 1 applied ===');
console.log('File length:', c.length);

fs.writeFileSync(filePath, c, 'utf8');
console.log('Saved to', filePath);
