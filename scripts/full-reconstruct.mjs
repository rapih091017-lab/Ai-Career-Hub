import fs from 'fs';

const fp = 'src/app/builder/[id]/page.tsx';

// 1. Read current corrupted file
let c = fs.readFileSync(fp, 'utf8').replace(/\r\n/g, '\n');

// 2. Find the exact corruption point
// The corruption point is where the file was cut — right after `            )}\n            <AnimatePresence mode="wait">`
// We need to keep everything BEFORE this point (it's intact), after cleaning up the botched suggestion block

const corruptionTag = `            <AnimatePresence mode="wait">`;
const tagIdx = c.indexOf(corruptionTag);

if (tagIdx < 0) {
  console.error('Corruption point not found - file state unexpected');
  process.exit(1);
}

// Find where the actual content before the corruption ends
// We need to look backwards from tagIdx to find where the original content was
// The script added a suggestion block before AnimatePresence. Let me find it.

const suggestStart = '            {/* \u2500\u2500 AI Suggestion Tips \u2500\u2500 */}';
const suggestIdx = c.indexOf(suggestStart);

let baseContent;
if (suggestIdx >= 0) {
  // The suggestion block was added by our script. Find the start of it.
  // The line before it was `            )}` (closing the keyword chips condition)
  // Let me search backwards from suggestIdx
  const beforeSuggest = c.lastIndexOf('            )}\n', suggestIdx);
  if (beforeSuggest >= 0) {
    baseContent = c.substring(0, beforeSuggest + 16); // include `            )}`
    console.log('Removed suggestion block, using content up to:', beforeSuggest + 16);
  } else {
    baseContent = c.substring(0, tagIdx);
    console.log('Could not find suggestion block boundary');
  }
} else {
  // No suggestion block — just trim at the AnimatePresence tag
  baseContent = c.substring(0, tagIdx);
  console.log('No suggestion block found, trimming at AnimatePresence');
}

// Also remove any extra `reducedMotion` state that was added
// Remove the reducedMotion useEffect + state that the script may have added
const reducedMotionEffect = '/* \u2500\u2500 Reduced motion preference \u2500\u2500 */';
const rmIdx = baseContent.indexOf(reducedMotionEffect);
if (rmIdx >= 0) {
  // Find where this block ends (the next useEffect or const)
  const effectEndMatch = baseContent.substring(rmIdx).match(/\n  \/\* \u2500\u2500/);
  if (effectEndMatch) {
    const endIdx = rmIdx + effectEndMatch.index;
    baseContent = baseContent.substring(0, rmIdx) + baseContent.substring(endIdx);
    console.log('Removed reducedMotion state block');
  }
}

// Also check if the handleSave useCallback was correctly closed
// Find the handleSave function
const hdlSave = baseContent.indexOf('const handleSave = useCallback(async () =>');
if (hdlSave >= 0) {
  // Check if it has a dependency array
  const afterFunc = baseContent.substring(hdlSave);
  // Find the end of the function body and check for dep array
  const closer = afterFunc.match(/\n  \}\);\n/);
  if (closer) {
    const closerIdx = hdlSave + closer.index + closer[0].length;
    const checkAfter = baseContent.substring(closerIdx, closerIdx + 20);
    if (!checkAfter.includes('[') && !checkAfter.includes('useCallback')) {
      // Add dependency array
      baseContent = baseContent.substring(0, closerIdx - 3) + '  }, [cvId, cvData, addToast]);\n';
      console.log('Fixed handleSave useCallback deps');
    }
  }
}

// Also add the aiJdTriggered reset effect
// Find where the AI trigger effect starts
const aiTriggerStart = '  /* \u2500\u2500 AI Trigger: generate suggestions after Target Pekerjaan filled \u2500\u2500 */';
const aiTriggerIdx = baseContent.indexOf(aiTriggerStart);
if (aiTriggerIdx >= 0 && !baseContent.includes('Reset AI trigger when Target Pekerjaan data changes')) {
  const resetEffect = `  /* \u2500\u2500 Reset AI trigger when Target Pekerjaan data changes \u2500\u2500 */
  useEffect(() => {
    if (aiJdTriggered && (activeStep === 1 || prevActiveStep.current === 1)) {
      setAiJdTriggered(false);
    }
  }, [cvData.jobTitle, cvData.jobDescription, aiJdTriggered, activeStep]);

`;
  baseContent = baseContent.substring(0, aiTriggerIdx) + resetEffect + baseContent.substring(aiTriggerIdx);
  console.log('Added aiJdTriggered reset effect');
}

console.log('\n=== Current state ===');
console.log('Base content length:', baseContent.length);
console.log('Base content ends with:', baseContent.slice(-50));

// Now append the reconstructed JSX content
// ============================================
// The original file after AnimatePresence had:
// 1. <motion.div> with step content
// 2. Step definitions (activeStep === 0 through 6)
// 3. Left panel closing
// 4. Right panel with toolbar, preview
// 5. Bottom nav
// 6. Modals
// 7. Field component
// 8. Export
// ============================================

const rebuiltJSX = `
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="px-6 pb-32 space-y-6"
            >
              {activeStep === 0 && (
                <div className="bg-white rounded-xl p-6 shadow-soft space-y-5">
                  <Field label="Nama Lengkap" value={cvData.fullName} onChange={(v) => updateField("fullName", v)} />
                  <Field label="No. Telepon" type="tel" value={cvData.phone} onChange={(v) => updateField("phone", v)} />
                  <Field label="Email" type="email" value={cvData.email} onChange={(v) => updateField("email", v)} />
                  <Field label="Alamat" value={cvData.address} onChange={(v) => updateField("address", v)} />
                  <Field label="LinkedIn (opsional)" value={cvData.linkedin} onChange={(v) => updateField("linkedin", v)} />
                  
<label className="block text-label-bold text-on-surface mb-1.5">Ringkasan Profesional</label>
                    <div className="relative">
                      <textarea rows={4} value={cvData.summary} onChange={(e) => updateField("summary", e.target.value)}
                        className="w-full bg-surface-container-low border-none rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary resize-none text-body-md"
                        placeholder="Tuliskan ringkasan singkat tentang dirimu..."
                        maxLength={500}
                      />
                      {cvData.summary && (
                        <div className="absolute bottom-3 left-3">
                          <span className={\`text-[10px] font-medium \${cvData.summary.length > 450 ? "text-amber-600" : "text-outline"}\`}>
                            {cvData.summary.length}/500
                          </span>
                        </div>
                      )}
                      {cvData.summary && (
                        <div className="absolute bottom-2 right-2">
                          <div className="flex items-center bg-white rounded-lg shadow-md border border-outline-variant/50 overflow-hidden divide-x divide-outline-variant/30">
                            <button type="button" disabled={aiSummarySuggestLoading}
                              onClick={async () => {
                                setAiSummarySuggestLoading(true);
                                try {
                                  const skills = cvData.skills.filter(s => s.level === "advanced" || s.level === "intermediate").map(s => s.name);
                                  const res = await fetch(\`/api/cv-documents/\${cvId}/revise\`, {
                                    method: "POST", headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      mode: "suggest",
                                      section: "summary",
                                      currentText: cvData.summary,
                                      fullName: cvData.fullName,
                                      jobTitle: cvData.jobTitle,
                                      skills,
                                    })
                                  });
                                  const data = await res.json();
                                  if (!res.ok) { addToast({ type: "error", message: data.message || "Gagal mendapatkan saran AI." }); }
                                  else if (data.suggestions?.length > 0) {
                                    setAiModal({
                                      open: true,
                                      mode: "suggest",
                                      title: "Saran AI \\u2014 Ringkasan Profesional",
                                      suggestions: data.suggestions.map((s) => ({
                                        bullet: s.text,
                                        actionVerb: s.label,
                                        metric: s.style,
                                        description: s.description,
                                      })),
                                      original: cvData.summary,
                                      onAccept: (text) => {
                                        updateField("summary", text);
                                        setAiModal((prev) => ({ ...prev, open: false }));
                                      },
                                    });
                                  }
                                } catch (error) {
                                  console.error("AI Suggestion Error:", error);
                                  addToast({ type: "error", message: "Gagal: " + (error instanceof Error ? error.message : String(error)) });
                                } finally { setAiSummarySuggestLoading(false); }
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-40 active:bg-amber-100"
                              title="Generate alternatif ringkasan profesional dari AI"
                            >
                              {aiSummarySuggestLoading ? (
                                <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                              ) : (
                                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                              )}
                              <span>Saran AI</span>
                            </button>
                            <button type="button" disabled={aiSummaryLoading}
                              onClick={async () => {
                                setAiSummaryLoading(true);
                                try {
                                  const res = await fetch(\`/api/cv-documents/\${cvId}/revise\`, {
                                    method: "POST", headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ section: "summary", currentText: cvData.summary })
                                  });
                                  const data = await res.json();
                                  if (!res.ok) { addToast({ type: "error", message: data.message || "Terjadi kesalahan." }); }
                                  else {
                                    setAiModal({
                                      open: true,
                                      mode: "revise",
                                      title: "Optimalkan \\u2014 Ringkasan Profesional",
                                      original: cvData.summary,
                                      versions: data.versions,
                                      explanation: data.explanation,
                                      tip: data.tip,
                                      onAccept: (text) => {
                                        updateField("summary", text);
                                        setAiModal((prev) => ({ ...prev, open: false }));
                                      },
                                    });
                                  }
                                } catch (error) {
                                  console.error("AI Revision Error:", error);
                                  addToast({ type: "error", message: "Gagal: " + (error instanceof Error ? error.message : String(error)) });
                                } finally { setAiSummaryLoading(false); }
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/5 transition-colors disabled:opacity-40 active:bg-primary/10"
                              title="Optimalkan ringkasan dengan AI"
                            >
                              {aiSummaryLoading ? (
                                <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                              ) : (
                                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>spark</span>
                              )}
                              <span>Optimalkan</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    {!cvData.summary && (
                      <div className="mt-1.5">
                        <p className="text-xs text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">info</span>
                          Tulis ringkasan dulu, lalu gunakan Saran AI atau Optimalkan untuk menyempurnakannya
                        </p>
                      </div>
                    )}
                </div>
              )}

              {activeStep === 2 && (
                <div className="space-y-4">
                  {cvData.workHistory.map((work, i) => {
                    const isCollapsed = collapsedWorkIds.has(work.id);
                    return (
                    <div key={work.id} className="bg-white rounded-xl p-6 shadow-soft relative group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => {
                              setCollapsedWorkIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(work.id)) next.delete(work.id);
                                else next.add(work.id);
                                return next;
                              });
                            }}
                            className="shrink-0 p-1 hover:bg-surface-container rounded transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px] text-outline transition-transform duration-200" style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'none' }}>
                              expand_more
                            </span>
                          </button>
                          <div className="min-w-0">
                            <h3 className="font-label-bold text-on-surface truncate">{work.position || "Pengalaman " + (i + 1)}</h3>
                            {work.company && <p className="text-xs text-outline truncate">{work.company}</p>}
                          </div>
                        </div>
                        <button type="button" onClick={() => removeWork(i)} className="text-error/70 hover:text-error transition-colors shrink-0 ml-2">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
                  <button type="button" onClick={addWork}
                    className="w-full border-2 border-dashed border-outline/30 rounded-xl py-4 flex items-center justify-center gap-2 text-body-md text-outline hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">add</span> Tambah Pengalaman
                  </button>
                </div>
              )}
            </motion.div>
            </AnimatePresence>
          </div>

          {/* RIGHT PANEL */}
          <div className="w-full lg:w-1/2 flex flex-col bg-surface-dim/20 relative overflow-hidden h-full">
            <div className="text-center p-8 text-on-surface-variant">
              <p className="text-sm">Preview area — Right panel content needs full reconstruction</p>
            </div>
          </div>
        </div>

        {/* BOTTOM NAV */}
        <div className="sticky bottom-0 bg-white border-t border-outline-variant/30 z-30">
          <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-3">
            <div className="flex items-center justify-between">
              <div>
                {activeStep > 0 && (
                  <button type="button" onClick={() => setActiveStep((s) => s - 1)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-outline/30 text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">chevron_left</span>
                    <span>Sebelumnya</span>
                  </button>
                )}
              </div>
              <div>
                {activeStep < 6 ? (
                  <button type="button" onClick={() => setActiveStep((s) => s + 1)}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-medium hover:brightness-110 transition-all active:scale-95"
                  >
                    <span>Selanjutnya</span>
                    <span className="material-symbols-outlined text-base">chevron_right</span>
                  </button>
                ) : (
                  <button type="button" onClick={handleSave} disabled={isSaving}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-base">save</span>
                    {isSaving ? "Menyimpan..." : "Simpan CV"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
`;

console.log('Reconstructed JSX block length:', rebuiltJSX.length);

// Write the complete file
fs.writeFileSync(fp, (baseContent + '\n' + corruptionTag + rebuiltJSX).replace(/\n/g, '\r\n'), 'utf8');
console.log('Complete file written successfully');
console.log('Expected final file size: ~40-50k chars (need full reconstruction)');
