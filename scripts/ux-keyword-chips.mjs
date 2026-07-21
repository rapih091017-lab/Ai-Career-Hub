import fs from 'fs';

const fp = 'src/app/builder/[id]/page.tsx';
let c = fs.readFileSync(fp, 'utf8');
c = c.replace(/\r\n/g, '\n');

// Add a keyword chips banner after the sectionMeta definition
// Insert right before the section title helper comment ends and AI trigger begins
const insertionPoint = '  /* ── AI Trigger: generate suggestions after Target Pekerjaan filled ── */';

const keywordPanel = `  /* ── AI Keyword Suggestions Panel ── */
  const keywordChips = useMemo(() => {
    if (!aiJdKeywords || aiJdKeywords.length === 0) return null;
    return aiJdKeywords;
  }, [aiJdKeywords]);
`;

if (c.includes(insertionPoint)) {
  c = c.replace(insertionPoint, keywordPanel + insertionPoint);
  console.log('✓ Keyword chips state added');
}

// Add the keyword chips component inside the main render, before the AnimatePresence
// Find the AnimatePresence opening and insert a keyword banner before it
const animatePresenceStart = '            <AnimatePresence mode="wait">';
const keywordBanner = `            {/* ── AI Keyword Suggestions Banner ── */}\n            {aiJdKeywords && aiJdKeywords.length > 0 && activeStep !== 1 && activeStep !== 6 && (\n              <div className="flex flex-wrap items-center gap-2 px-1 py-2 mb-2 bg-primary/5 border border-primary/10 rounded-xl">\n                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary shrink-0">\n                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>travel_explore</span>\n                  <span>Kata Kunci:</span>\n                </div>\n                {aiJdKeywords.slice(0, 10).map((kw, i) => (\n                  <span key={i} className="px-2 py-0.5 bg-white rounded-full text-[10px] font-medium text-primary border border-primary/20 cursor-default hover:bg-primary/10 transition-colors">\n                    {kw}\n                  </span>\n                ))}\n                {aiJdKeywords.length > 10 && (\n                  <span className="text-[10px] text-outline">+{aiJdKeywords.length - 10} lainnya</span>\n                )}\n              </div>\n            )}\n\n`;

if (c.includes(animatePresenceStart)) {
  // Insert the keyword banner BEFORE AnimatePresence
  // But we need to find the right spot - right after the closing div of sectionMeta
  const idx = c.indexOf(animatePresenceStart);
  // Go back to find the previous </div> and insert there
  const prevDivEnd = c.lastIndexOf('</div>', idx);
  if (prevDivEnd !== -1) {
    const insertAt = c.indexOf('\n', prevDivEnd) + 1;
    c = c.slice(0, insertAt) + keywordBanner + c.slice(insertAt);
    console.log('✓ Keyword chips banner added in render');
  } else {
    console.log('! Could not find insertion point for keyword banner');
  }
}

// Write back
fs.writeFileSync(fp, c.replace(/\n/g, '\r\n'), 'utf8');
console.log('Done');
