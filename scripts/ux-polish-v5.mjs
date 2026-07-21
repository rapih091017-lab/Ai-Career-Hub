import fs from 'fs';

const fp = 'src/app/builder/[id]/page.tsx';
let c = fs.readFileSync(fp, 'utf8');

// Normalize CRLF to LF
c = c.replace(/\r\n/g, '\n');

let changes = 0;

/* ═══════════════════════════════════════════════════
   CHANGE 1: Fix handleSave — wrap in useCallback
   ═══════════════════════════════════════════════════ */
// handleSave is already referenced via ref in keyboard shortcuts, 
// but wrapping in useCallback keeps it consistent & prevents unnecessary re-renders.
// The useCallback import already exists at line 4.

const oldHandleSave = `  const handleSave = async () => {`;
const newHandleSave = `  const handleSave = useCallback(async () => {`;

if (c.includes(oldHandleSave)) {
  c = c.replace(oldHandleSave, newHandleSave);
  changes++;
  console.log('✓ Change 1: handleSave wrapped in useCallback');
} else {
  console.log('! Change 1: Pattern not found, might already be done');
}

// Find handleSave's closing )} and add dependency array
// The pattern: end of handleSave function is `  };`
// We need to change `  };` to `  }, [cvId, cvData, addToast]);`
// Let me find the exact handleSave function first

const hdlIdx = c.indexOf('const handleSave = useCallback(async () => {');
if (hdlIdx >= 0) {
  // Find the matching `  };` that closes this useCallback
  let depth = 0;
  let startLooking = false;
  let closeIdx = -1;
  for (let i = hdlIdx; i < c.length; i++) {
    const ch = c[i];
    if (ch === '{') {
      depth++;
      startLooking = true;
    } else if (ch === '}') {
      depth--;
      if (startLooking && depth === 0) {
        closeIdx = i;
        break;
      }
    }
  }
  
  if (closeIdx >= 0) {
    // Check what comes after this closing brace
    const afterClose = c.substring(closeIdx, closeIdx + 10);
    console.log('  Found handleSave closing at', closeIdx, 'after:', JSON.stringify(afterClose));
    
    // Replace `  };` after the closing brace with deps
    const oldEnd = '  };\n';
    // The closing should be followed by `  };`
    // Let me check if deps already exist
    if (c.substring(closeIdx, closeIdx + 20).includes('[')) {
      console.log('  handleSave already has dependency array');
    } else {
      // Find the end of this function block
      const endIdx = c.indexOf('  };', closeIdx);
      if (endIdx >= 0 && endIdx < closeIdx + 15) {
        c = c.substring(0, endIdx) + '  }, [cvId, cvData, addToast]);\n' + c.substring(endIdx + 4);
        changes++;
        console.log('✓ Change 1: Added dependency array to handleSave');
      }
    }
  }
}

/* ═══════════════════════════════════════════════════
   CHANGE 2: Fix aiJdTriggered reset
   ═══════════════════════════════════════════════════ */
// Add useEffect that resets aiJdTriggered when jobTitle or jobDescription changes
const aiTriggerEffectPat = `  /* ── AI Trigger: generate suggestions after Target Pekerjaan filled ── */`;

// Find the aiJdTriggered useEffect and add a reset before it
const resetEffect = `
  /* ── Reset AI trigger when Target Pekerjaan data changes ── */
  useEffect(() => {
    if (aiJdTriggered && (activeStep === 1 || prevActiveStep.current === 1)) {
      setAiJdTriggered(false);
    }
  }, [cvData.jobTitle, cvData.jobDescription, aiJdTriggered, activeStep]);
`;

const resetInsertIdx = c.indexOf(aiTriggerEffectPat);
if (resetInsertIdx >= 0 && !c.includes('Reset AI trigger when Target Pekerjaan data changes')) {
  c = c.substring(0, resetInsertIdx) + resetEffect + '\n\n  ' + c.substring(resetInsertIdx);
  changes++;
  console.log('✓ Change 2: Added aiJdTriggered reset effect');
} else {
  console.log('! Change 2: Pattern not found or already exists');
}

/* ═══════════════════════════════════════════════════
   CHANGE 3: Consume aiJdSuggestions in the UI
   ═══════════════════════════════════════════════════ */
// Add a suggestions panel that appears right before the AI trigger area
// But actually, we should add it in the JSX area where other AI content is shown.
// The suggestions should be an expandable panel in the form area.

// Add a suggestion reading useEffect that shows inline content per section
// Let me add it as a banner under the keyword chips, but only when not on step 1 or 6

// Actually, let me add inline suggestion consumption in the Keyword Chips section
// Find the keyword chips JSX and add suggestion panel after it

// First, let me add the consumption logic in state management
// The aiJdSuggestions is already typed as any[] | null
// I need to reference it in the UI. Let me add a suggestion consumption block
// in the main JSX, between the keyword chips and the AnimatePresence

const suggestBlock = `
            {/* ── AI Suggestion Tips ── */}
            {aiJdSuggestions && aiJdSuggestions.length > 0 && activeStep !== 6 && (
              <div className="mx-4 mb-2 p-3 rounded-xl bg-amber-50/80 border border-amber-200/60">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-600 text-sm shrink-0 mt-0.5" aria-hidden="true">lightbulb</span>
                  <div>
                    <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1">Saran AI untuk CV-mu</p>
                    <ul className="space-y-1">
                      {aiJdSuggestions.slice(0, 3).map((s: any, i: number) => (
                        <li key={i} className="text-[11px] text-amber-900/80 leading-relaxed flex items-start gap-1.5">
                          <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                          <span>{s.text || s.bullet || s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
`;

// Find the keyword chips closing and the AnimatePresence opening
const keywordChipsEnd = `              </div>
            )}


            <AnimatePresence mode="wait">`;

const keywordChipsEndIdx = c.indexOf(keywordChipsEnd);
if (keywordChipsEndIdx >= 0 && !c.includes('AI Suggestion Tips')) {
  c = c.substring(0, keywordChipsEndIdx) + '              </div>\n            )}' + suggestBlock + '\n            <AnimatePresence mode="wait">';
  changes++;
  console.log('✓ Change 3: Added AI Suggestion Tips panel');
} else {
  console.log('! Change 3: Pattern not found or already exists');
}

/* ═══════════════════════════════════════════════════
   CHANGE 4: Add prefers-reduced-motion for AI FAB pulse
   ═══════════════════════════════════════════════════ */
// Add a reduced motion state near the other state declarations
// And modify the pulse span condition

// Find the section where the AI button is rendered
// The AI button is in the formatting toolbar
const aiButtonPattern = `                  {/* AI Revision — FAB Style */}`;
const aiBtnIdx = c.indexOf(aiButtonPattern);

if (aiBtnIdx >= 0) {
  // Find the animate-ping span within this area
  const areaAfter = c.substring(aiBtnIdx, aiBtnIdx + 800);
  const pingIdx = areaAfter.indexOf('animate-ping');
  
  if (pingIdx >= 0) {
    // Replace `animate-ping` with conditional class
    const oldPing = 'animate-ping';
    // Find the exact span containing animate-ping
    const spanStart = areaAfter.lastIndexOf('<span', pingIdx);
    const spanEnd = areaAfter.indexOf('>', pingIdx);
    if (spanStart >= 0 && spanEnd >= 0) {
      const fullSpanOld = areaAfter.substring(spanStart, spanEnd + 1);
      // Replace animate-ping with conditional
      const fullSpanNew = fullSpanOld.replace(oldPing, '${reducedMotion ? "opacity-30" : "animate-ping"}');
      
      // Get the absolute index
      const absStart = aiBtnIdx + spanStart;
      const absEnd = aiBtnIdx + spanEnd + 1;
      
      c = c.substring(0, absStart) + fullSpanNew + c.substring(absEnd);
      changes++;
      console.log('✓ Change 4: Added reduced-motion class to AI FAB pulse');
    }
  }
  
  // Now add the reducedMotion state declaration near the top
  // Find a good place to add it — after the useState boilerplate
  // Add after `const [aiJdTriggered, setAiJdTriggered] = useState(false);`
  const jdTriggerLine = 'const [aiJdTriggered, setAiJdTriggered] = useState(false);';
  const jdTriggerIdx = c.indexOf(jdTriggerLine);
  
  if (jdTriggerIdx >= 0 && !c.includes('usePrefersReducedMotion') && !c.includes('reducedMotion')) {
    // Add reduced motion state + effect after this line
    const reduceBlock = `
  /* ── Reduced motion preference ── */
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
`;
    c = c.substring(0, jdTriggerIdx + jdTriggerLine.length) + reduceBlock + c.substring(jdTriggerIdx + jdTriggerLine.length);
    changes++;
    console.log('✓ Change 4: Added reducedMotion state + useEffect');
  }
} else {
  console.log('! Change 4: AI button pattern not found');
}

/* ═══════════════════════════════════════════════════
   CHANGE 5: Add aria-labels for icon-only buttons
   ═══════════════════════════════════════════════════ */
// Find Delete buttons missing aria-label
let deleteCount = 0;
// Pattern: `<button type="button" onClick={() => removeWork(i)} className="text-error/70 hover:text-error transition-colors shrink-0 ml-2">`
c = c.replace(
  /<button type="button" onClick=\{\(\) => removeWork\((\w+)\)\} className="text-error\/70 hover:text-error transition-colors shrink-0 ml-2">/g,
  (match, varName) => {
    deleteCount++;
    return `<button type="button" onClick={() => removeWork(${varName})} className="text-error/70 hover:text-error transition-colors shrink-0 ml-2" aria-label="Hapus pengalaman">`;
  }
);

// Education delete buttons
c = c.replace(
  /<button type="button" onClick=\{\(\) => removeEducation\((\w+)\)\} className="text-error\/70 hover:text-error transition-colors">/g,
  (match, varName) => {
    deleteCount++;
    return `<button type="button" onClick={() => removeEducation(${varName})} className="text-error/70 hover:text-error transition-colors" aria-label="Hapus pendidikan">`;
  }
);

// Organization delete buttons
c = c.replace(
  /<button type="button" onClick=\{\(\) => removeOrganization\((\w+)\)\} className="text-error\/70 hover:text-error transition-colors">/g,
  (match, varName) => {
    deleteCount++;
    return `<button type="button" onClick={() => removeOrganization(${varName})} className="text-error/70 hover:text-error transition-colors" aria-label="Hapus organisasi">`;
  }
);

// Skill delete buttons
c = c.replace(
  /<button type="button" onClick=\{\(\) => removeSkill\((\w+)\)\} className="text-error\/70 hover:text-error transition-colors shrink-0">/g,
  (match, varName) => {
    deleteCount++;
    return `<button type="button" onClick={() => removeSkill(${varName})} className="text-error/70 hover:text-error transition-colors shrink-0" aria-label="Hapus skill">`;
  }
);

if (deleteCount > 0) {
  changes++;
  console.log(`✓ Change 5: Added ${deleteCount} aria-labels to delete buttons`);
} else {
  console.log('! Change 5: No delete button patterns found');
}

// Also fix the fullName placeholder mention in ATS template line
const namePlaceholderLinks = c.match(/NAMA LENGKAP ANDA/g);
if (namePlaceholderLinks) {
  // These are in the CV template string, not needed to change
  console.log(`  Found ${namePlaceholderLinks.length} 'NAMA LENGKAP ANDA' references (template, skipping)`);
}

/* ═══════════════════════════════════════════════════
   Final: Write file back
   ═══════════════════════════════════════════════════ */
fs.writeFileSync(fp, c.replace(/\n/g, '\r\n'), 'utf8');
console.log(`\n✅ Done — ${changes} changes applied`);
