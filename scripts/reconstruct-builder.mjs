import fs from 'fs';

const fp = 'src/app/builder/[id]/page.tsx';
const corrupted = fs.readFileSync(fp, 'utf8').replace(/\r\n/g, '\n');

// The current corrupted file ends at ~line 945 with AnimatePresence tag
// First, find exactly where to cut off
const corruptionPoint = `            )}
            <AnimatePresence mode="wait">`;

const cpIdx = corrupted.indexOf(corruptionPoint);
if (cpIdx < 0) {
  console.error('Corruption point not found!');
  process.exit(1);
}

// Keep everything BEFORE the corruption point
let base = corrupted.substring(0, cpIdx);

// Now we know base ends with:
// `            )}`
// which closes the aiJdSuggestions || aiJdKeywords condition from the script
// But the ORIGINAL file had: `            <AnimatePresence mode="wait">` directly after
// the keyword chips (no suggestion block)
// 
// We need to strip the suggestion block that my script added incorrectly
// The ORIGINAL pattern was:
//   `              </div>
//             )}
//
//             <AnimatePresence mode="wait">`

// Let me check what's currently in the last ~20 lines
const lines = base.split('\n');
const last20 = lines.slice(-20);
console.log('=== LAST 20 LINES OF CURRENT FILE ===');
last20.forEach((l, i) => console.log(`[${lines.length - 20 + i}] ${l.substring(0, 100)}`));

// The script added: 
// `              </div>
//             )}
// {suggestBlock}
//             <AnimatePresence mode="wait">`
//
// So we need to find where the original content was and strip the suggestion block
// The suggestion block starts with `            {/* ── AI Suggestion Tips ── */}`
// and ends with `            )}
//             <AnimatePresence mode="wait">`

// We need to REMOVE the suggestion block
const suggestBlockStart = '            {/* ── AI Suggestion Tips ── */}';
const suggestStartIdx = base.indexOf(suggestBlockStart);

if (suggestStartIdx >= 0) {
  // Find the closing of the suggestion block (the `            )}` before AnimatePresence)
  const afterSuggest = base.substring(suggestStartIdx);
  // The block ends with `            )}\n\n            <AnimatePresence`
  const blockEnd = afterSuggest.indexOf('            )}\n\n            <AnimatePresence');
  
  if (blockEnd >= 0) {
    const endOfBlock = suggestStartIdx + blockEnd + '            )}'.length;
    // Remove the suggestion block from base
    base = base.substring(0, suggestStartIdx - 4) + '\n' + base.substring(endOfBlock);
    console.log('✓ Removed suggestion block');
  } else {
    console.log('! Could not find end of suggestion block');
    // Fallback: keep base as is but we know the file was truncated
  }
} else {
  console.log('No suggestion block found, file may have different state');
}

// Now reconstruct the missing content
// The original content after `            <AnimatePresence mode="wait">` was:
const missingContent = `            <motion.div
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
                        placeholder="Tuliskan ringkasan singkat tentang dirimu…"
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
                                  const res = await fetch(\\\`/api/cv-documents/\${cvId}/revise\\\`, {
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
                                      title: "Saran AI — Ringkasan Profesional",
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
                                  const res = await fetch(\\\`/api/cv-documents/\${cvId}/revise\\\`, {
                                    method: "POST", headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ section: "summary", currentText: cvData.summary })
                                  });
                                  const data = await res.json();
                                  if (!res.ok) { addToast({ type: "error", message: data.message || "Terjadi kesalahan." }); }
                                  else {
                                    setAiModal({
                                      open: true,
                                      mode: "revise",
                                      title: "Optimalkan — Ringkasan Profesional",
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

`;

console.log('Missing content length (partial):', missingContent.length);
console.log('Base length:', base.length);
console.log('Reconstructed length (expected ~112k):', base.length + missingContent.length);

// Write the reconstructed file
fs.writeFileSync(fp, (base + missingContent).replace(/\n/g, '\r\n'), 'utf8');
console.log('Done!');
