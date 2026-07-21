import fs from 'fs';

const filePath = 'src/app/builder/[id]/page.tsx';
let c = fs.readFileSync(filePath, 'utf8');

const log = (msg) => console.log('✓', msg);

/* ================================================================
   CHANGE 1: Re-order steps array
   ================================================================ */
c = c.replace(
  `const steps = [\n  "Data Pribadi",\n  "Pengalaman Kerja",\n  "Pendidikan",\n  "Organisasi",\n  "Skill & Lainnya",\n  "Target Pekerjaan",\n  "Review",\n];`,
  `const steps = [\n  "Data Pribadi",\n  "Target Pekerjaan",\n  "Pengalaman Kerja",\n  "Pendidikan",\n  "Organisasi",\n  "Skill & Lainnya",\n  "Review",\n];`
);
log('Steps array reordered');

/* ================================================================
   CHANGE 1b: Update sectionCompletion array order
   ================================================================ */
c = c.replace(
  `    return [\n      // 0: Data Pribadi — nama WAJIB + (email atau phone)\n      !!cvData.fullName && (!!cvData.email || !!cvData.phone),\n      // 1: Pengalaman Kerja — minimal 1 entry dengan posisi\n      cvData.workHistory.some(w => !!w.position || !!w.company),\n      // 2: Pendidikan — minimal 1 entry\n      cvData.education.some(e => !!e.institution || !!e.degree),\n      // 3: Organisasi — minimal 1 entry\n      cvData.organisations.some(o => !!o.name),\n      // 4: Skill — minimal 1 skill terisi\n      cvData.skills.some(s => !!s.name),\n      // 5: Target Pekerjaan — jobTitle atau jobDescription terisi\n      !!cvData.jobTitle || !!cvData.jobDescription,\n      // 6: Review — always accessible\n      true,\n    ];`,
  `    return [\n      // 0: Data Pribadi — nama WAJIB + (email atau phone)\n      !!cvData.fullName && (!!cvData.email || !!cvData.phone),\n      // 1: Target Pekerjaan — jobTitle atau jobDescription terisi\n      !!cvData.jobTitle || !!cvData.jobDescription,\n      // 2: Pengalaman Kerja — minimal 1 entry dengan posisi\n      cvData.workHistory.some(w => !!w.position || !!w.company),\n      // 3: Pendidikan — minimal 1 entry\n      cvData.education.some(e => !!e.institution || !!e.degree),\n      // 4: Organisasi — minimal 1 entry\n      cvData.organisations.some(o => !!o.name),\n      // 5: Skill — minimal 1 skill terisi\n      cvData.skills.some(s => !!s.name),\n      // 6: Review — always accessible\n      true,\n    ];`
);
log('sectionCompletion reordered');

/* ================================================================
   CHANGE 1c: Update sectionMeta array order
   ================================================================ */
c = c.replace(
  `  const sectionMeta = [\n    { title: "Data Pribadi", desc: "Lengkapi informasi diri kamu untuk memulai CV.", icon: "person" },\n    { title: "Pengalaman Kerja", desc: "Cantumkan riwayat pekerjaan yang relevan.", icon: "work" },\n    { title: "Pendidikan", desc: "Tambahkan latar belakang pendidikan formal kamu.", icon: "school" },\n    { title: "Organisasi", desc: "Masukkan pengalaman organisasi atau kepanitiaan.", icon: "groups" },\n    { title: "Skill & Lainnya", desc: "Tuliskan keahlian, sertifikasi, dan bahasa yang dikuasai.", icon: "star" },\n    { title: "Target Pekerjaan", desc: "Masukkan posisi yang dilamar dan deskripsi pekerjaan.", icon: "work_history" },\n    { title: "Review", desc: "Periksa kembali data CV sebelum menyimpan.", icon: "visibility" },\n  ];`,
  `  const sectionMeta = [\n    { title: "Data Pribadi", desc: "Lengkapi informasi diri kamu untuk memulai CV.", icon: "person" },\n    { title: "Target Pekerjaan", desc: "Masukkan posisi yang dilamar dan deskripsi pekerjaan.", icon: "work_history" },\n    { title: "Pengalaman Kerja", desc: "Cantumkan riwayat pekerjaan yang relevan.", icon: "work" },\n    { title: "Pendidikan", desc: "Tambahkan latar belakang pendidikan formal kamu.", icon: "school" },\n    { title: "Organisasi", desc: "Masukkan pengalaman organisasi atau kepanitiaan.", icon: "groups" },\n    { title: "Skill & Lainnya", desc: "Tuliskan keahlian, sertifikasi, dan bahasa yang dikuasai.", icon: "star" },\n    { title: "Review", desc: "Periksa kembali data CV sebelum menyimpan.", icon: "visibility" },\n  ];`
);
log('sectionMeta reordered');

/* ================================================================
   CHANGE 1d: Renumber activeStep conditionals (swap step positions)
   Strategy: temp values to avoid conflicts
   - 1 (Pengalaman Kerja) → temp 98
   - 2 (Pendidikan) → temp 97
   - 3 (Organisasi) → temp 96
   - 4 (Skill & Lainnya) → temp 95
   - 5 (Target Pekerjaan) → 1
   - 98 (Pengalaman Kerja) → 2
   - 97 (Pendidikan) → 3
   - 96 (Organisasi) → 4
   - 95 (Skill & Lainnya) → 5
   ================================================================ */

// Step 1: temp values (use unique markers in each block to avoid mis-replacement)
// Pengalaman Kerja block contains "Tambah Pengalaman"
// Pendidikan block contains "Tambah Pendidikan"
// Organisasi block contains "Tambah Organisasi"
// Skill & Lainnya block contains "Tambah Skill"

// Pengalaman Kerja: activeStep === 1 (has cvData.workHistory.map + "Tambah Pengalaman")
c = c.replace('{activeStep === 1 && (\n                <div className="space-y-4">\n                  {cvData.workHistory.map((work, i) => {',
  '{activeStep === 98 && (\n                <div className="space-y-4">\n                  {cvData.workHistory.map((work, i) => {');

// Pendidikan: activeStep === 2 (has cvData.education.map + "Tambah Pendidikan")
c = c.replace('{activeStep === 2 && (\n                <div className="space-y-4">\n                  {cvData.education.map((edu, i) => (',
  '{activeStep === 97 && (\n                <div className="space-y-4">\n                  {cvData.education.map((edu, i) => (');

// Organisasi: activeStep === 3 (has cvData.organisations.map + "Tambah Organisasi")
c = c.replace('{activeStep === 3 && (\n                <div className="space-y-4">\n                  {cvData.organisations.map((org, i) => (',
  '{activeStep === 96 && (\n                <div className="space-y-4">\n                  {cvData.organisations.map((org, i) => (');

// Skill & Lainnya: activeStep === 4 (has cvData.skills.map + "Tambah Skill")
c = c.replace('{activeStep === 4 && (\n                <div className="space-y-3">\n                  {cvData.skills.map((skill, i) => (',
  '{activeStep === 95 && (\n                <div className="space-y-3">\n                  {cvData.skills.map((skill, i) => (');

log('Temp renumbering done');

// Step 2: Target Pekerjaan (was ===5) goes to ===1
c = c.replace('{activeStep === 5 && (\n                <div className="bg-white rounded-xl p-6 shadow-soft space-y-5">',
  '{activeStep === 1 && (\n                <div className="bg-white rounded-xl p-6 shadow-soft space-y-5">');

// Step 3: Temp values → final positions
c = c.replace('{activeStep === 98 && (\n                <div className="space-y-4">\n                  {cvData.workHistory.map((work, i) => {',
  '{activeStep === 2 && (\n                <div className="space-y-4">\n                  {cvData.workHistory.map((work, i) => {');

c = c.replace('{activeStep === 97 && (\n                <div className="space-y-4">\n                  {cvData.education.map((edu, i) => (',
  '{activeStep === 3 && (\n                <div className="space-y-4">\n                  {cvData.education.map((edu, i) => (');

c = c.replace('{activeStep === 96 && (\n                <div className="space-y-4">\n                  {cvData.organisations.map((org, i) => (',
  '{activeStep === 4 && (\n                <div className="space-y-4">\n                  {cvData.organisations.map((org, i) => (');

c = c.replace('{activeStep === 95 && (\n                <div className="space-y-3">\n                  {cvData.skills.map((skill, i) => (',
  '{activeStep === 5 && (\n                <div className="space-y-3">\n                  {cvData.skills.map((skill, i) => (');

log('activeStep conditionals renumbered');

/* ================================================================
   CHANGE 2: Remove Language field from Data Pribadi (Step 0)
   Unique marker: "Bahasa CV" div block
   ================================================================ */
// Find and remove the CV Language block
const langStart = c.indexOf('{/* CV Language */}');
const langEndMatch = c.slice(langStart).match(/<\/div>\n                <div>\n                    <label className="block text-label-bold text-on-surface mb-1\.5">Ringkasan Profesional/);
if (langStart !== -1 && langEndMatch) {
  const langEnd = langStart + langEndMatch.index;
  const beforeLang = c.slice(0, langStart);
  const afterLang = c.slice(langEnd);
  c = beforeLang + afterLang;
  log('Language field removed');
} else {
  console.log('! Language field not found or already removed');
}

/* ================================================================
   CHANGE 3: AI Revision button → gradient FAB with pulse
   Old: "Beli AI Revision" button with router.push(`/cv/${cvId}/checkout`)
   ================================================================ */
const aiOldStart = c.indexOf('{/* Beli AI Revision */}');
const aiOldMatch = c.slice(aiOldStart).match(/<span className="hidden sm:inline">AI Rev<\/span>\n                <\/button>\n              <\/MagneticButton>/);
if (aiOldStart !== -1 && aiOldMatch) {
  const aiOldEnd = aiOldStart + aiOldMatch.index + aiOldMatch[0].length;
  const beforeAi = c.slice(0, aiOldStart);
  const afterAi = c.slice(aiOldEnd);
  c = beforeAi + `{/* AI Revision — FAB Style */}\n              <MagneticButton>\n                <motion.button\n                  onClick={() => setShowAiOptimizerModal ? setShowAiOptimizerModal(true) : router.push(\`/cv/\${cvId}/checkout\`)}\n                  className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-md overflow-hidden"\n                  style={{ background: "linear-gradient(135deg, #00897B, #26A69A)" }}\n                  whileHover={{ scale: 1.05 }}\n                  whileTap={{ scale: 0.95 }}\n                  title="Optimalkan CV dengan AI"\n                >\n                  {/* Pulse ring */}\n                  <span className="absolute inset-0 rounded-lg animate-ping opacity-30" style={{ background: "linear-gradient(135deg, #00897B, #26A69A)" }} />\n                  <span className="material-symbols-outlined text-sm relative z-10" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>\n                  <span className="relative z-10 hidden sm:inline">AI Rev</span>\n                </motion.button>\n              </MagneticButton>` + afterAi;
  log('AI Revision button upgraded to gradient FAB');
} else {
  console.log('! AI Revision button not found');
}

/* ================================================================
   CHANGE 4: Add AI trigger after Target Pekerjaan filled
   Add useEffect that detects when user moves past Target Pekerjaan step
   and has filled jobTitle/jobDescription
   ================================================================ */
// Add the effect after the existing sectionMeta definition
const aiTriggerCode = `
  /* ── AI Trigger: generate suggestions after Target Pekerjaan filled ── */
  const prevActiveStep = useRef(activeStep);
  const [aiJdSuggestions, setAiJdSuggestions] = useState(null);
  const [aiJdKeywords, setAiJdKeywords] = useState(null);
  const [aiJdTriggered, setAiJdTriggered] = useState(false);

  useEffect(() => {
    // Detect transition FROM step 1 (Target Pekerjaan) TO step 2+
    const justLeftTargetPekerjaan = prevActiveStep.current === 1 && activeStep > 1;
    const hasTargetData = cvData.jobTitle || cvData.jobDescription;
    
    if (justLeftTargetPekerjaan && hasTargetData && !aiJdTriggered) {
      setAiJdTriggered(true);
      const skills = cvData.skills.filter(s => s.level === "advanced" || s.level === "intermediate").map(s => s.name);
      
      fetch(\`/api/cv-documents/\${cvId}/revise\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "suggest",
          section: "general",
          currentText: cvData.jobDescription,
          jobTitle: cvData.jobTitle,
          jobDescription: cvData.jobDescription,
          skills,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.suggestions?.length > 0) {
            setAiJdSuggestions(data.suggestions);
            addToast({
              type: "success",
              message: "AI menganalisis deskripsi pekerjaan! Saran kata kunci tersedia di setiap section.",
              duration: 5000,
            });
          }
          if (data.keywords?.length > 0) {
            setAiJdKeywords(data.keywords);
          }
        })
        .catch(() => {
          addToast({
            type: "info",
            message: "Isi setiap section dengan kata kunci dari deskripsi pekerjaan agar CV lebih optimal.",
            duration: 4000,
          });
        });
    }
    
    prevActiveStep.current = activeStep;
  }, [activeStep, cvData.jobTitle, cvData.jobDescription, cvData.skills, cvId, addToast, aiJdTriggered]);
`;

const metaEnd = c.indexOf('\n  /* ── loading / error ── */');
if (metaEnd !== -1) {
  c = c.slice(0, metaEnd) + aiTriggerCode + c.slice(metaEnd);
  log('AI trigger effect added');
} else {
  console.log('! Could not find insertion point for AI trigger');
}

/* ================================================================
   Write back
   ================================================================ */
fs.writeFileSync(filePath, c, 'utf8');
console.log('\n✅ All changes written successfully!');
