import fs from 'fs';

const fp = 'src/app/builder/[id]/page.tsx';
let c = fs.readFileSync(fp, 'utf8');

const replacements = [
  // 1. activeStep === 1 (Pengalaman Kerja - has workHistory) -> 98
  [
    '{activeStep === 1 && (\n                <div className="space-y-4">\n                  {cvData.workHistory.map((work, i) => {',
    '{activeStep === 98 && (\n                <div className="space-y-4">\n                  {cvData.workHistory.map((work, i) => {'
  ],
  // 2. activeStep === 2 (Pendidikan - has education.map) -> 97
  [
    '{activeStep === 2 && (\n                <div className="space-y-4">\n                  {cvData.education.map((edu, i) => (',
    '{activeStep === 97 && (\n                <div className="space-y-4">\n                  {cvData.education.map((edu, i) => ('
  ],
  // 3. activeStep === 3 (Organisasi - has organisations.map) -> 96
  [
    '{activeStep === 3 && (\n                <div className="space-y-4">\n                  {cvData.organisations.map((org, i) => (',
    '{activeStep === 96 && (\n                <div className="space-y-4">\n                  {cvData.organisations.map((org, i) => ('
  ],
  // 4. activeStep === 4 (Skill - has skills.map) -> 95
  [
    '{activeStep === 4 && (\n                <div className="space-y-3">\n                  {cvData.skills.map((skill, i) => (',
    '{activeStep === 95 && (\n                <div className="space-y-3">\n                  {cvData.skills.map((skill, i) => ('
  ],
];

for (const [oldStr, newStr] of replacements) {
  if (c.includes(oldStr)) {
    c = c.replace(oldStr, newStr);
    console.log('✓ Temp replacement applied');
  } else {
    console.log('! Not found, may already be set:', oldStr.slice(0, 60));
  }
}

// 5. Target Pekerjaan block (was ===5, has "Posisi yang Dilamar") -> ===1
const oldTpBlock = '{activeStep === 5 && (\n                <div className="bg-white rounded-xl p-6 shadow-soft space-y-5">\n                  <div className="flex items-start gap-3 pb-5 border-b border-outline-variant/20">\n                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">\n                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "\'FILL\' 1" }}>work_history</span>';
const newTpBlock = '{activeStep === 1 && (\n                <div className="bg-white rounded-xl p-6 shadow-soft space-y-5">\n                  <div className="flex items-start gap-3 pb-5 border-b border-outline-variant/20">\n                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">\n                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "\'FILL\' 1" }}>work_history</span>';

if (c.includes(oldTpBlock)) {
  c = c.replace(oldTpBlock, newTpBlock);
  console.log('✓ Target Pekerjaan moved to ===1');
} else {
  console.log('! Target Pekerjaan block not found with exact match');
}

// 6. Temp values -> final positions
const finalReplacements = [
  ['{activeStep === 98 && (\n                <div className="space-y-4">\n                  {cvData.workHistory.map((work, i) => {',
   '{activeStep === 2 && (\n                <div className="space-y-4">\n                  {cvData.workHistory.map((work, i) => {'],
  ['{activeStep === 97 && (\n                <div className="space-y-4">\n                  {cvData.education.map((edu, i) => (',
   '{activeStep === 3 && (\n                <div className="space-y-4">\n                  {cvData.education.map((edu, i) => ('],
  ['{activeStep === 96 && (\n                <div className="space-y-4">\n                  {cvData.organisations.map((org, i) => (',
   '{activeStep === 4 && (\n                <div className="space-y-4">\n                  {cvData.organisations.map((org, i) => ('],
  ['{activeStep === 95 && (\n                <div className="space-y-3">\n                  {cvData.skills.map((skill, i) => (',
   '{activeStep === 5 && (\n                <div className="space-y-3">\n                  {cvData.skills.map((skill, i) => ('],
];

for (const [oldStr, newStr] of finalReplacements) {
  if (c.includes(oldStr)) {
    c = c.replace(oldStr, newStr);
    console.log('✓ Final position applied');
  } else {
    console.log('! Not found:', oldStr.slice(0, 60));
  }
}

// 7. Remove Language field from Step 0
const langStart = c.indexOf('{/* CV Language */}');
if (langStart !== -1) {
  // Find the end: the opening of Ringkasan Profesional section
  // The language block ends just before <div> with Ringkasan Profesional label
  const searchFrom = c.indexOf('<label className="block text-label-bold text-on-surface mb-1.5">Ringkasan Profesional</label>', langStart);
  if (searchFrom !== -1) {
    // Find the start of the parent div containing the language section
    // Look backwards from langStart to find the opening <div> tag
    const divStart = c.lastIndexOf('\n                  <div>', langStart);
    if (divStart !== -1) {
      console.log('Language div starts at:', divStart);
      console.log('Ringkasan Profesional starts at:', searchFrom);
      // Remove from divStart to searchFrom
      c = c.slice(0, divStart) + '\n' + c.slice(searchFrom);
      console.log('✓ Language field removed');
    }
  }
} else {
  console.log('! Language field already removed or not found');
}

// 8. Upgrade AI Revision button
const aiBtnStart = c.indexOf('{/* Beli AI Revision */}');
if (aiBtnStart !== -1) {
  const aiBtnEnd = c.indexOf('</MagneticButton>', aiBtnStart);
  const aiBtnEndClose = c.indexOf('</MagneticButton>', aiBtnEnd + 1);
  if (aiBtnEndClose !== -1) {
    const replacement = `{/* AI Revision — FAB Style */}
              <MagneticButton>
                <motion.button
                  onClick={() => router.push(\`/cv/\${cvId}/checkout\`)}
                  className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-md overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #00897B, #26A69A)" }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Optimalkan CV dengan AI"
                >
                  <span className="absolute inset-0 rounded-lg animate-ping opacity-30" style={{ background: "linear-gradient(135deg, #00897B, #26A69A)" }} />
                  <span className="material-symbols-outlined text-sm relative z-10" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  <span className="relative z-10 hidden sm:inline">AI Rev</span>
                </motion.button>
              </MagneticButton>`;
    c = c.slice(0, aiBtnStart) + replacement + c.slice(aiBtnEndClose + 18);
    console.log('✓ AI Revision button upgraded');
  }
} else {
  console.log('! AI Revision button not found');
}

fs.writeFileSync(fp, c, 'utf8');
console.log('\n✅ DONE - all changes applied!');
