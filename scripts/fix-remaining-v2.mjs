import fs from 'fs';

const fp = 'src/app/builder/[id]/page.tsx';
let c = fs.readFileSync(fp, 'utf8');

// Normalize CRLF to LF for clean matching
c = c.replace(/\r\n/g, '\n');

const log = (msg, ok) => console.log(ok ? '✓' : '✗', msg);

// ===== CHANGE 1: Renumber activeStep conditionals =====
// Strategy: use temp placeholders to avoid conflicts

// Step 1: Map current positions to temp
const step1 = [
  // activeStep === 1 (Pengalaman Kerja) -> 98
  ['{activeStep === 1 && (\n                <div className="space-y-4">\n                  {cvData.workHistory.map((work, i) => {',
   '{activeStep_TEMP_98 && (\n                <div className="space-y-4">\n                  {cvData.workHistory.map((work, i) => {'],
  // activeStep === 2 (Pendidikan) -> 97
  ['{activeStep === 2 && (\n                <div className="space-y-4">\n                  {cvData.education.map((edu, i) => (',
   '{activeStep_TEMP_97 && (\n                <div className="space-y-4">\n                  {cvData.education.map((edu, i) => ('],
  // activeStep === 3 (Organisasi) -> 96
  ['{activeStep === 3 && (\n                <div className="space-y-4">\n                  {cvData.organisations.map((org, i) => (',
   '{activeStep_TEMP_96 && (\n                <div className="space-y-4">\n                  {cvData.organisations.map((org, i) => ('],
  // activeStep === 4 (Skill & Lainnya) -> 95
  ['{activeStep === 4 && (\n                <div className="space-y-3">\n                  {cvData.skills.map((skill, i) => (',
   '{activeStep_TEMP_95 && (\n                <div className="space-y-3">\n                  {cvData.skills.map((skill, i) => ('],
  // activeStep === 5 (Target Pekerjaan) -> temporarily move to 94 first
  ['{activeStep === 5 && (\n                <div className="bg-white rounded-xl p-6 shadow-soft space-y-5">\n                  <div className="flex items-start gap-3 pb-5 border-b border-outline-variant/20">\n                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">\n                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "\'FILL\' 1" }}>work_history</span>',
   '{activeStep_TEMP_94 && (\n                <div className="bg-white rounded-xl p-6 shadow-soft space-y-5">\n                  <div className="flex items-start gap-3 pb-5 border-b border-outline-variant/20">\n                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">\n                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "\'FILL\' 1" }}>work_history</span>'],
];

let count1 = 0;
for (const [oldStr, newStr] of step1) {
  if (c.includes(oldStr)) {
    c = c.replace(oldStr, newStr);
    count1++;
  }
}
log(`Step 1: ${count1}/5 temp replacements applied`, count1 === 5);

// Step 2: Assign final positions
const step2 = [
  // TEMP_94 (Target Pekerjaan) -> 1
  ['{activeStep_TEMP_94 && (\n                <div className="bg-white rounded-xl p-6 shadow-soft space-y-5">\n                  <div className="flex items-start gap-3 pb-5 border-b border-outline-variant/20">\n                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">\n                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "\'FILL\' 1" }}>work_history</span>',
   '{activeStep === 1 && (\n                <div className="bg-white rounded-xl p-6 shadow-soft space-y-5">\n                  <div className="flex items-start gap-3 pb-5 border-b border-outline-variant/20">\n                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">\n                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "\'FILL\' 1" }}>work_history</span>'],
  // TEMP_98 (Pengalaman Kerja) -> 2
  ['{activeStep_TEMP_98 && (\n                <div className="space-y-4">\n                  {cvData.workHistory.map((work, i) => {',
   '{activeStep === 2 && (\n                <div className="space-y-4">\n                  {cvData.workHistory.map((work, i) => {'],
  // TEMP_97 (Pendidikan) -> 3
  ['{activeStep_TEMP_97 && (\n                <div className="space-y-4">\n                  {cvData.education.map((edu, i) => (',
   '{activeStep === 3 && (\n                <div className="space-y-4">\n                  {cvData.education.map((edu, i) => ('],
  // TEMP_96 (Organisasi) -> 4
  ['{activeStep_TEMP_96 && (\n                <div className="space-y-4">\n                  {cvData.organisations.map((org, i) => (',
   '{activeStep === 4 && (\n                <div className="space-y-4">\n                  {cvData.organisations.map((org, i) => ('],
  // TEMP_95 (Skill & Lainnya) -> 5
  ['{activeStep_TEMP_95 && (\n                <div className="space-y-3">\n                  {cvData.skills.map((skill, i) => (',
   '{activeStep === 5 && (\n                <div className="space-y-3">\n                  {cvData.skills.map((skill, i) => ('],
];

let count2 = 0;
for (const [oldStr, newStr] of step2) {
  if (c.includes(oldStr)) {
    c = c.replace(oldStr, newStr);
    count2++;
  }
}
log(`Step 2: ${count2}/5 final positions applied`, count2 === 5);

// ===== CHANGE 2: Remove Language field =====
const langSection = `{/* CV Language */}
                  <div>
                    <label className="block text-label-bold text-on-surface mb-1.5">Bahasa CV</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateField("cvLang", "id")}
                        className={\`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all \${" "$}
                          cvData.cvLang === "id"
                            ? "bg-primary text-on-primary shadow-sm"
                            : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                        }\`}
                      >
                        🇮🇩 Indonesia
                      </button>
                      <button
                        type="button"
                        onClick={() => updateField("cvLang", "en")}
                        className={\`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all \${" "$}
                          cvData.cvLang === "en"
                            ? "bg-primary text-on-primary shadow-sm"
                            : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                        }\`}
                      >
                        🇬🇧 English
                      </button>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">info</span>
                      Section headers, labels, dan tanggal akan tampil sesuai bahasa yang dipilih
                    </p>
                  </div>`;

// More targeted approach: find the start marker and the end marker
const cvLangIdx = c.indexOf('{/* CV Language */}');
if (cvLangIdx !== -1) {
  // Find the next <div> that contains "Ringkasan Profesional" label after this
  const ringkasanIdx = c.indexOf('<label className="block text-label-bold text-on-surface mb-1.5">Ringkasan Profesional</label>', cvLangIdx);
  if (ringkasanIdx !== -1) {
    // The language div ends just before Ringkasan Profesional starts
    // Go backwards from ringkasanIdx to find the closing </div> of the language section
    // The structure is: ...LinkedIn field... {/\* CV Language */} <div>...</div> <div>Ringkasan Profesional...
    // So we remove from cvLangIdx to ringkasanIdx
    // First find the actual start - go back to find the preceding </div> or start of line
    const precedingDivEnd = c.lastIndexOf('</div>\n', cvLangIdx);
    // Remove everything from the line containing {/\* CV Language */} to the line before Ringkasan Profesional
    c = c.slice(0, cvLangIdx) + '\n' + c.slice(ringkasanIdx);
    log('Language field removed', true);
  } else {
    log('Ringkasan Profesional label not found after Language field', false);
  }
} else {
  log('Language field already removed', true);
}

// Write back with original CRLF
fs.writeFileSync(fp, c.replace(/\n/g, '\r\n'), 'utf8');
console.log('\n✅ Done!');
