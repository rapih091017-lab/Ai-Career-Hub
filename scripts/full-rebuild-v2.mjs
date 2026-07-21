import fs from 'fs';

const fp = 'src/app/builder/[id]/page.tsx';
let c = fs.readFileSync(fp, 'utf8').replace(/\r\n/g, '\n');

/* ─────────────────────────────────────────────────────
   STEP 1: Fix the "work_historyy" typo
   ───────────────────────────────────────────────────── */
c = c.replace('"work_historyy"', '"work_history"');
console.log('✓ Fixed work_historyy typo');

/* ─────────────────────────────────────────────────────
   STEP 2: Add step definitions for activeStep === 1, 3, 4, 5, 6
   AND expand activeStep === 2 with full work entry fields
   ───────────────────────────────────────────────────── */

// The step content is inside <motion.div> after AnimatePresence.
// Currently: step 0 (Data Pribadi) is complete, step 2 (Pengalaman) is partial.
// Steps 1, 3, 4, 5, 6 are missing.
// I need to APPEND them after the existing step 2 content, before the closing </motion.div>

const motionDivEnd = `            </motion.div>`;

// Insert all missing steps BEFORE the closing motion.div
const missingSteps = `
              {activeStep === 1 && (
                <div className="bg-white rounded-xl p-6 shadow-soft space-y-5">
                  <div className="flex items-start gap-3 pb-5 border-b border-outline-variant/20">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>work_history</span>
                    </div>
                    <div>
                      <h3 className="font-headline-md text-[18px] text-on-surface">Posisi yang Dilamar</h3>
                      <p className="text-body-md text-on-surface-variant mt-0.5">Masukkan posisi target dan deskripsi pekerjaan agar AI bisa menyesuaikan konten CV-mu.</p>
                    </div>
                  </div>
                  <Field label="Judul Posisi" value={cvData.jobTitle} onChange={(v) => updateField("jobTitle", v)} />
                  <div>
                    <label className="block text-label-bold text-on-surface mb-1.5">Deskripsi Pekerjaan</label>
                    <textarea rows={5} value={cvData.jobDescription} onChange={(e) => updateField("jobDescription", e.target.value)}
                      className="w-full bg-surface-container-low border-none rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary resize-none text-body-md"
                      placeholder="Tempelkan deskripsi pekerjaan yang dilamar..."
                      maxLength={3000}
                    />
                    {cvData.jobDescription && (
                      <p className="text-[10px] text-outline mt-1 text-right">{cvData.jobDescription.length}/3000 karakter</p>
                    )}
                    <p className="text-xs text-on-surface-variant mt-1.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm" aria-hidden="true">info</span>
                      AI akan menganalisis deskripsi ini untuk mengoptimalkan kata kunci di CV-mu
                    </p>
                  </div>
                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                    <p className="text-sm text-on-surface-variant">Dengan mengisi deskripsi pekerjaan, AI dapat menyesuaikan kata kunci, pengalaman, dan skill yang ditampilkan agar lebih relevan dengan posisi yang kamu lamar.</p>
                  </div>
                </div>
              )}

`;

// For steps 3-6, we need to add them INSIDE the motion.div
// Let me find where to insert them (after the closing `)}` of activeStep 2's map)
// The last activeStep === 2 content ends with `                  </button>
//                 </div>
//               )}`

const step2EndMarker = `                  </button>
                </div>
              )}`;

// But we need to be more precise. Let me find the exact position.
// Currently, activeStep === 2 ends just before `            </motion.div>`
// Let me insert the missing steps between existing step content and </motion.div>

// First, let me also fix activeStep === 2 to have FULL work entry fields
// The current activeStep 2 only has header + collapse + delete
// It needs: position, company, location fields, isCurrent checkbox, description with AI buttons

// Find the work entry in activeStep === 2
const workEntryStart = `                      </div>
                        <button type="button" onClick={() => removeWork(i)} className="text-error/70 hover:text-error transition-colors shrink-0 ml-2">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>`;

// Replace the partial work entry with full version (add form fields inside collapsed content)
const fullWorkEntry = `                      </div>
                        <button type="button" onClick={() => removeWork(i)} className="text-error/70 hover:text-error transition-colors shrink-0 ml-2">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>

                      {!isCollapsed && (
                        <div className="space-y-4">
                          <Field label="Posisi Jabatan" value={work.position} onChange={(v) => updateWork(i, "position", v)} />
                          <Field label="Perusahaan" value={work.company} onChange={(v) => updateWork(i, "company", v)} />
                          <Field label="Lokasi" value={work.location} onChange={(v) => updateWork(i, "location", v)} />
                          <div className="grid grid-cols-2 gap-4">
                            <Field label="Mulai" type="month" value={work.startDate} onChange={(v) => updateWork(i, "startDate", v)} />
                            <Field label="Selesai" type="month" value={work.endDate} onChange={(v) => updateWork(i, "endDate", v)} disabled={work.isCurrent} />
                          </div>
                          <label className="relative flex items-center gap-2.5 cursor-pointer select-none mt-2 group">
                            <input type="checkbox" checked={work.isCurrent ?? false}
                              onChange={(e) => { updateWork(i, "isCurrent", e.target.checked as any); if (e.target.checked) updateWork(i, "endDate", ""); }}
                              className="peer sr-only"
                            />
                            <div className="w-5 h-5 rounded-md border-2 border-outline-variant bg-white flex items-center justify-center transition-all duration-200 peer-checked:bg-primary peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30 group-hover:border-primary/60">
                              {work.isCurrent && (
                                <span className="material-symbols-outlined text-sm text-white">check</span>
                              )}
                            </div>
                            <span className="text-body-md text-on-surface-variant group-hover:text-on-surface transition-colors">Saya masih bekerja di sini</span>
                          </label>
                          <div>
                            <label className="block text-label-bold text-on-surface mb-1.5">Deskripsi</label>
                            <div className="relative">
                              <textarea rows={3} value={work.description} onChange={(e) => updateWork(i, "description", e.target.value)}
                                className="w-full bg-surface-container-low border-none rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary resize-none text-body-md pr-72"
                                placeholder="Jelaskan tanggung jawab dan pencapaianmu..."
                              />
                              {work.description && (
                                <div className="absolute bottom-3 left-3">
                                  <span className={\`text-[10px] font-medium \${work.description.length > 850 ? "text-amber-600" : "text-outline"}\`}>
                                    {work.description.length}/1000 | {work.description.split(/\\s+/).filter(Boolean).length} kata
                                  </span>
                                </div>
                              )}
                              <div className="absolute bottom-2 right-2 flex flex-col gap-1">
                                <div className="flex items-center bg-white rounded-lg shadow-md border border-outline-variant/50 overflow-hidden divide-x divide-outline-variant/30">
                                  <button type="button" disabled={aiSuggestLoadingId === work.id}
                                    onClick={async () => {
                                      setAiSuggestLoadingId(work.id);
                                      try {
                                        const res = await fetch(\\\`/api/cv-documents/\${cvId}/revise\\\`, {
                                          method: "POST", headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ mode: "suggest", position: work.position, company: work.company, description: work.description || "", skills: cvData.skills.filter(s => s.level === "advanced" || s.level === "intermediate").map(s => s.name) })
                                        });
                                        const data = await res.json();
                                        if (!res.ok) { addToast({ type: "error", message: data.message || "Gagal mendapatkan saran AI." }); }
                                        else {
                                          const bullets = data.suggestions?.map((s: any) => s.bullet) || [];
                                          if (bullets.length > 0) {
                                            const newText = bullets.join("\\\\n");
                                            setAiModal({
                                              open: true,
                                              mode: "suggest",
                                              title: \\\`Saran AI \\u2014 \${work.position || "Posisi " + (i + 1)}\\\`,
                                              suggestions: data.suggestions,
                                              onAccept: (text: string) => {
                                                updateWork(i, "description", text);
                                                setAiModal((prev) => ({ ...prev, open: false }));
                                              },
                                            });
                                          }
                                        }
                                      } catch (error) {
                                        console.error("AI Suggestion Error:", error); addToast({ type: "error", message: "Gagal: " + (error instanceof Error ? error.message : String(error)) });
                                      } finally { setAiSuggestLoadingId(null); }
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-40 active:bg-amber-100"
                                    title="Generate bullet points achievement-based dari AI"
                                  >
                                    {aiSuggestLoadingId === work.id ? (
                                      <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                                    ) : (
                                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                                    )}
                                    <span>Saran AI</span>
                                  </button>
                                  <button type="button" disabled={aiLoadingId === work.id}
                                    onClick={async () => {
                                      setAiLoadingId(work.id);
                                      try {
                                        const res = await fetch(\\\`/api/cv-documents/\${cvId}/revise\\\`, {
                                          method: "POST", headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ section: "workHistory", sectionIndex: i, field: "description", currentText: work.description || "" })
                                        });
                                        const data = await res.json();
                                        if (!res.ok) { addToast({ type: "error", message: data.message || "Terjadi kesalahan saat menghubungi AI." }); }
                                        else {
                                          setAiModal({
                                            open: true,
                                            mode: "revise",
                                            title: \\\`Optimalkan \\u2014 \${work.position || "Posisi " + (i + 1)}\\\`,
                                            original: work.description,
                                            versions: data.versions,
                                            explanation: data.explanation,
                                            tip: data.tip,
                                            onAccept: (text: string) => {
                                              const updatedWorkHistory = [...cvData.workHistory];
                                              updatedWorkHistory[i] = { ...updatedWorkHistory[i], description: text };
                                              setCvData(prev => ({ ...prev, workHistory: updatedWorkHistory }));
                                              setAiModal((prev) => ({ ...prev, open: false }));
                                            },
                                          });
                                        }
                                      } catch (error) {
                                        console.error("AI Revision Error:", error); addToast({ type: "error", message: "Gagal: " + (error instanceof Error ? error.message : String(error)) });
                                      } finally { setAiLoadingId(null); }
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/5 transition-colors disabled:opacity-40 active:bg-primary/10"
                                    title="Optimalkan teks dengan AI"
                                  >
                                    {aiLoadingId === work.id ? (
                                      <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                                    ) : (
                                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>spark</span>
                                    )}
                                    <span>Optimalkan</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>`;

// Check if the work entry is already expanded (has the form fields)
if (c.includes('<Field label="Posisi Jabatan"')) {
  console.log('Work entry already has form fields, skipping expansion');
} else if (c.includes(workEntryStart)) {
  c = c.replace(workEntryStart, fullWorkEntry);
  console.log('✓ Expanded work entry with full form fields + AI buttons');
} else {
  console.log('! Could not find work entry pattern to expand');
}

// Now add missing step definitions (1, 3, 4, 5, 6)
// Find the motion.div closing and insert before it
const closeMotIdx = c.lastIndexOf(motionDivEnd);
if (closeMotIdx >= 0) {
  // Check which steps are already present
  const hasStep1 = c.includes('activeStep === 1 &&');
  const hasStep3 = c.includes('activeStep === 3 &&');
  const hasStep4 = c.includes('activeStep === 4 &&');
  const hasStep5 = c.includes('activeStep === 5 &&');
  const hasStep6 = c.includes('activeStep === 6 &&');
  
  let stepsToAdd = '';
  
  if (!hasStep1) {
    stepsToAdd += `              {activeStep === 1 && (
                <div className="bg-white rounded-xl p-6 shadow-soft space-y-5">
                  <div className="flex items-start gap-3 pb-5 border-b border-outline-variant/20">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>work_history</span>
                    </div>
                    <div>
                      <h3 className="font-headline-md text-[18px] text-on-surface">Posisi yang Dilamar</h3>
                      <p className="text-body-md text-on-surface-variant mt-0.5">Masukkan posisi target dan deskripsi pekerjaan agar AI bisa menyesuaikan konten CV-mu.</p>
                    </div>
                  </div>
                  <Field label="Judul Posisi" value={cvData.jobTitle} onChange={(v) => updateField("jobTitle", v)} />
                  <div>
                    <label className="block text-label-bold text-on-surface mb-1.5">Deskripsi Pekerjaan</label>
                    <textarea rows={5} value={cvData.jobDescription} onChange={(e) => updateField("jobDescription", e.target.value)}
                      className="w-full bg-surface-container-low border-none rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary resize-none text-body-md"
                      placeholder="Tempelkan deskripsi pekerjaan yang dilamar..."
                      maxLength={3000}
                    />
                    {cvData.jobDescription && (
                      <p className="text-[10px] text-outline mt-1 text-right">{cvData.jobDescription.length}/3000 karakter</p>
                    )}
                    <p className="text-xs text-on-surface-variant mt-1.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm" aria-hidden="true">info</span>
                      AI akan menganalisis deskripsi ini untuk mengoptimalkan kata kunci di CV-mu
                    </p>
                  </div>
                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                    <p className="text-sm text-on-surface-variant">Dengan mengisi deskripsi pekerjaan, AI dapat menyesuaikan kata kunci, pengalaman, dan skill yang ditampilkan agar lebih relevan dengan posisi yang kamu lamar.</p>
                  </div>
                </div>
              )}

`;
    console.log('✓ Added activeStep === 1 (Target Pekerjaan)');
  }
  
  if (!hasStep3) {
    stepsToAdd += `              {activeStep === 3 && (
                <div className="space-y-4">
                  {cvData.education.map((edu, i) => (
                    <div key={edu.id} className="bg-white rounded-xl p-6 shadow-soft space-y-4 relative">
                      <div className="flex items-center justify-between">
                        <h3 className="font-label-bold text-on-surface">Pendidikan {i + 1}</h3>
                        <button type="button" onClick={() => removeEducation(i)} className="text-error/70 hover:text-error transition-colors">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                      <Field label="Nama Institusi" value={edu.institution} onChange={(v) => updateEducation(i, "institution", v)} />
                      <Field label="Jenjang / Gelar" value={edu.degree} onChange={(v) => updateEducation(i, "degree", v)} />
                      <Field label="Bidang Studi" value={edu.field} onChange={(v) => updateEducation(i, "field", v)} />
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Tahun Mulai" type="month" value={edu.startDate} onChange={(v) => updateEducation(i, "startDate", v)} />
                        <Field label="Tahun Selesai" type="month" value={edu.endDate} onChange={(v) => updateEducation(i, "endDate", v)} />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addEducation}
                    className="w-full border-2 border-dashed border-outline/30 rounded-xl py-4 flex items-center justify-center gap-2 text-body-md text-outline hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">add</span> Tambah Pendidikan
                  </button>
                </div>
              )}

`;
    console.log('✓ Added activeStep === 3 (Pendidikan)');
  }
  
  if (!hasStep4) {
    stepsToAdd += `              {activeStep === 4 && (
                <div className="space-y-4">
                  {cvData.organisations.map((org, i) => (
                    <div key={org.id} className="bg-white rounded-xl p-6 shadow-soft space-y-4 relative">
                      <div className="flex items-center justify-between">
                        <h3 className="font-label-bold text-on-surface">Organisasi {i + 1}</h3>
                        <button type="button" onClick={() => removeOrganization(i)} className="text-error/70 hover:text-error transition-colors">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                      <Field label="Nama Organisasi" value={org.name} onChange={(v) => updateOrganization(i, "name", v)} />
                      <Field label="Posisi / Jabatan" value={org.position} onChange={(v) => updateOrganization(i, "position", v)} />
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Tanggal Mulai" type="month" value={org.startDate} onChange={(v) => updateOrganization(i, "startDate", v)} />
                        {org.isPresent ? (
                          <div>
                            <label className="block text-label-bold text-on-surface mb-1.5">Tanggal Selesai</label>
                            <div className="w-full bg-surface-container-low rounded-xl px-3 py-2 text-body-md text-on-surface-variant">Sekarang</div>
                          </div>
                        ) : (
                          <Field label="Tanggal Selesai" type="month" value={org.endDate} onChange={(v) => updateOrganization(i, "endDate", v)} />
                        )}
                      </div>
                      <label className="relative flex items-center gap-2.5 cursor-pointer select-none">
                        <input type="checkbox" checked={org.isPresent ?? false}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setCvData((prev) => {
                              const arr = [...prev.organisations];
                              arr[i] = { ...arr[i], isPresent: checked, endDate: checked ? "" : arr[i].endDate };
                              return { ...prev, organisations: arr };
                            });
                          }}
                          className="peer sr-only"
                        />
                        <div className="w-5 h-5 rounded-md border-2 border-outline-variant bg-white flex items-center justify-center transition-all duration-200 peer-checked:bg-primary peer-checked:border-primary">
                          {org.isPresent && (
                            <span className="material-symbols-outlined text-sm text-white">check</span>
                          )}
                        </div>
                        <span className="text-xs text-on-surface-variant">Sampai Sekarang</span>
                      </label>
                      <div>
                        <label className="block text-label-bold text-on-surface mb-1.5">Deskripsi Kegiatan</label>
                        <textarea rows={3} value={org.description} onChange={(e) => updateOrganization(i, "description", e.target.value)}
                          className="w-full bg-surface-container-low border-none rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary resize-none text-body-md"
                          placeholder="Jelaskan kegiatan dan kontribusimu..."
                        />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addOrganization}
                    className="w-full border-2 border-dashed border-outline/30 rounded-xl py-4 flex items-center justify-center gap-2 text-body-md text-outline hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">add</span> Tambah Organisasi
                  </button>
                </div>
              )}

`;
    console.log('✓ Added activeStep === 4 (Organisasi)');
  }
  
  if (!hasStep5) {
    stepsToAdd += `              {activeStep === 5 && (
                <div className="space-y-3">
                  {cvData.skills.map((skill, i) => (
                    <div key={skill.id} className="flex items-center gap-4 bg-white rounded-[16px] p-4 shadow-soft">
                      <div className="flex-1">
                        <input type="text" value={skill.name} onChange={(e) => updateSkill(i, "name", e.target.value)}
                          className="w-full bg-surface-container-low border-none rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary text-body-md" placeholder="Nama Skill"
                        />
                      </div>
                      <select value={skill.level} onChange={(e) => updateSkill(i, "level", e.target.value as SkillEntry["level"])}
                        className="bg-surface-container-low border-none rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary text-body-md min-w-[140px]"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                      <button type="button" onClick={() => removeSkill(i)} className="text-error/70 hover:text-error transition-colors shrink-0">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addSkill}
                    className="w-full border-2 border-dashed border-outline/30 rounded-[16px] py-3 flex items-center justify-center gap-2 text-body-md text-outline hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">add</span> Tambah Skill
                  </button>
                </div>
              )}

`;
    console.log('✓ Added activeStep === 5 (Skill & Lainnya)');
  }
  
  if (!hasStep6) {
    stepsToAdd += `              {activeStep === 6 && (
                <div className="space-y-5">
                  <div className="bg-white rounded-[20px] p-6 shadow-soft space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-label-bold text-on-surface">Ringkasan CV</h3>
                      <div className="flex items-center gap-1.5">
                        <div className="flex">
                          {[0,1,2,3,4,5].map((idx) => (
                            <div key={idx} className={\`w-5 h-1 rounded-full transition-all duration-500 \${
                              sectionCompletion[idx] ? "bg-primary" : "bg-outline-variant/50"
                            } ml-0.5 first:ml-0\`} />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-primary">{sectionCompletion.filter(Boolean).length}/6</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-body-md">
                      <p className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-600 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        <span className="text-on-surface font-medium">Profil:</span>
                        <span className="text-outline">{cvData.fullName || \\"--\\"}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-600 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        <span className="text-on-surface font-medium">Pengalaman Kerja:</span>
                        <span className="text-outline">{cvData.workHistory.length} posisi</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-600 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        <span className="text-on-surface font-medium">Pendidikan:</span>
                        <span className="text-outline">{cvData.education.length} institusi</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-600 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        <span className="text-on-surface font-medium">Organisasi:</span>
                        <span className="text-outline">{cvData.organisations.length} organisasi</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-600 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        <span className="text-on-surface font-medium">Skill:</span>
                        <span className="text-outline">{cvData.skills.length} keahlian</span>
                      </p>
                    </div>
                  </div>
                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
                    <p className="text-sm text-on-surface-variant">Pastikan semua data sudah lengkap sebelum menyimpan. Kamu bisa kembali ke step sebelumnya kapan saja.</p>
                  </div>
                </div>
              )}

`;
    console.log('✓ Added activeStep === 6 (Review)');
  }
  
  if (stepsToAdd) {
    c = c.substring(0, closeMotIdx) + stepsToAdd + c.substring(closeMotIdx);
    console.log(`✓ Inserted all missing step definitions before </motion.div>`);
  } else {
    console.log('All step definitions already present');
  }
}

/* ─────────────────────────────────────────────────────
   STEP 3: Replace RIGHT PANEL placeholder with full content
   ───────────────────────────────────────────────────── */
const rightPanelPlaceholder = `          {/* RIGHT PANEL */}
          <div className="w-full lg:w-1/2 flex flex-col bg-surface-dim/20 relative overflow-hidden h-full">
            <div className="text-center p-8 text-on-surface-variant">
              <p className="text-sm">Preview area — Right panel content needs full reconstruction</p>
            </div>
          </div>`;

const fullRightPanel = `          {/* ── RIGHT PANEL ── */}
          <div className="w-full lg:w-1/2 flex flex-col bg-surface-dim/20 relative overflow-hidden h-full">
            {/* ── FORMATTING TOOLBAR ── */}
            <div className="h-auto px-3 md:px-4 py-2 border-b border-outline-variant/30 flex flex-wrap items-center gap-2 bg-white shadow-sm z-20 shrink-0">
              {/* CV Completeness Bar */}
              <div className="flex items-center gap-1.5 shrink-0" title={\`CV \${cvCompleteness}% lengkap\`}>
                <div className="w-12 h-1.5 bg-outline-variant/30 rounded-full overflow-hidden">
                  <div
                    className={\`h-full rounded-full transition-all duration-500 \${
                      cvCompleteness >= 100 ? "bg-green-500" : cvCompleteness >= 50 ? "bg-primary" : "bg-amber-500"
                    }\`}
                    style={{ width: \`\${cvCompleteness}%\` }}
                  />
                </div>
                <span className="text-[9px] font-bold text-outline w-6 text-right">{cvCompleteness}%</span>
              </div>

              {/* Auto-save status */}
              {saveStatus !== "idle" && (
                <div className={\`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium shrink-0 \${
                  saveStatus === "saving" ? "text-amber-700 bg-amber-50 border border-amber-200" :
                  saveStatus === "saved" ? "text-green-700 bg-green-50 border border-green-200" :
                  "text-red-700 bg-red-50 border border-red-200"
                }\`}>
                  <span className={\`material-symbols-outlined text-[12px] \${saveStatus === "saving" ? "animate-spin" : ""}\`}>
                    {saveStatus === "saving" ? "sync" : saveStatus === "saved" ? "check" : "error"}
                  </span>
                  {saveStatus === "saving" ? "Menyimpan..." : saveStatus === "saved" ? "Tersimpan" : "Gagal simpan"}
                </div>
              )}

              {/* ATS Score */}
              <div className="flex items-center gap-1.5 bg-primary/5 border border-primary/20 rounded-lg px-2 py-1 shrink-0">
                <div className="relative w-6 h-6">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle className="stroke-current text-primary/20" cx="18" cy="18" fill="none" r="16" strokeWidth="3" />
                    <circle className="stroke-current text-primary" cx="18" cy="18" fill="none" r="16"
                      strokeDasharray={circumference.toFixed(2)} strokeDashoffset={scoreOffset.toFixed(2)}
                      strokeLinecap="round" strokeWidth="3"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-primary">{computeAtsScore}%</span>
                </div>
              </div>

              {/* Font family */}
              <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}
                className="bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs px-2 py-1.5 focus:ring-1 focus:ring-primary max-w-[120px]"
              >
                <option value=\"'Inter', sans-serif\">Inter</option>
                <option value=\"'Plus Jakarta Sans', sans-serif\">Plus Jakarta Sans</option>
                <option value=\"Arial, sans-serif\">Arial</option>
                <option value=\"'Times New Roman', serif\">Times New Roman</option>
                <option value=\"Roboto, sans-serif\">Roboto</option>
              </select>

              {/* Font size */}
              <div className="flex items-center gap-1 bg-surface-container-low rounded-lg px-1.5 py-1">
                <button onClick={() => setFontSize((s) => Math.max(9, s - 1))} className="p-0.5 hover:bg-white rounded text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm">remove</span>
                </button>
                <span className="text-xs font-bold w-6 text-center select-none">{fontSize}pt</span>
                <button onClick={() => setFontSize((s) => Math.min(12, s + 1))} className="p-0.5 hover:bg-white rounded text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm">add</span>
                </button>
              </div>

              {/* Text alignment */}
              <div className="flex items-center bg-surface-container-low rounded-lg p-0.5 gap-0.5">
                {([\"left\", \"center\", \"right\", \"justify\"] as const).map((align) => (
                  <button key={align} onClick={() => setTextAlign(align)}
                    className={\`p-1 rounded \${textAlign === align ? "bg-white shadow-sm" : "hover:bg-white/50"}\`}
                    title={\`Rata \${align === "left" ? "kiri" : align === "center" ? "tengah" : align === "right" ? "kanan" : "kanan kiri"}\`}
                  >
                    <span className="material-symbols-outlined text-sm">{align === "left" ? "format_align_left" : align === "center" ? "format_align_center" : align === "right" ? "format_align_right" : "format_align_justify"}</span>
                  </button>
                ))}
              </div>

              {/* Divider toggle */}
              <button onClick={() => setShowDividers((d) => !d)}
                className={\`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all \${showDividers ? "bg-primary/10 text-primary" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-variant"}\`}
                title="Tampilkan garis pembatas antar section"
              >
                <span className="material-symbols-outlined text-sm">horizontal_rule</span>
                <span className="hidden sm:inline">Divider</span>
              </button>

              {/* Section order */}
              <button onClick={() => setShowSectionOrderModal(true)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-surface-container-low text-on-surface-variant hover:bg-surface-variant transition-all"
                title="Atur urutan section"
              >
                <span className="material-symbols-outlined text-sm">reorder</span>
                <span className="hidden sm:inline">Urutan</span>
              </button>

              {/* Display Settings */}
              <button onClick={() => setShowDisplaySettings(true)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-surface-container-low text-on-surface-variant hover:bg-surface-variant transition-all"
                title="Pengaturan tampilan CV"
              >
                <span className="material-symbols-outlined text-sm">palette</span>
                <span className="hidden sm:inline">Tampilan</span>
              </button>

              {/* AI Revision — FAB Style */}
              <MagneticButton>
                <button
                  onClick={() => router.push(\`/cv/\${cvId}/checkout\`)}
                  className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-md overflow-hidden"
                  style={{ background: \"linear-gradient(135deg, #00897B, #26A69A)\" }}
                  title="Optimalkan CV dengan AI"
                >
                  <span className="absolute inset-0 rounded-lg animate-ping opacity-30" style={{ background: \"linear-gradient(135deg, #00897B, #26A69A)\" }} />
                  <span className="material-symbols-outlined text-sm relative z-10" style={{ fontVariationSettings: \"'FILL' 1\" }}>auto_awesome</span>
                  <span className="relative z-10 hidden sm:inline">AI Rev</span>
                </button>
              </MagneticButton>

              {/* Export PDF */}
              <MagneticButton>
                <button onClick={handleExportPdf} disabled={isPdfExporting}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary text-on-primary rounded-lg font-label-bold hover:brightness-110 transition-all text-xs shadow-sm active:scale-95 disabled:opacity-60 ml-auto"
                >
                  {isPdfExporting ? (
                    <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                  ) : (
                    <span className="material-symbols-outlined text-sm">download</span>
                  )}
                  <span className="hidden sm:inline">PDF</span>
                </button>
              </MagneticButton>
            </div>

            {/* ── PREVIEW AREA ── */}
            <div className="flex-1 overflow-y-auto bg-surface-dim/20 p-4 md:p-8 flex flex-col items-center custom-scrollbar">
              {/* A4 Paper Preview */}
              <div ref={previewRef} className="a4-preview origin-top scale-[0.85] lg:scale-100 max-w-full" style={{ fontFamily }}>
                <AtsBaseRenderer
                  data={{ ...cvData, customSections }}
                  lang={cvData.cvLang}
                  style={{
                    ...(TEMPLATE_STYLES[selectedTemplateId] || TEMPLATE_STYLES[\"ats-profesional\"]),
                    bodySize: fontSize,
                    bodyFont: fontFamily,
                    headingFont: fontFamily,
                    textAlign,
                    ...(customPrimaryColor ? { primary: customPrimaryColor, sectionTitle: customPrimaryColor } : {}),
                  }}
                  sectionOrder={sectionOrder.filter(key => sectionVisibility[key] !== false)}
                  showDividers={showDividers}
                  headerLayout={headerLayout}
                  lineHeight={spacingMode === "compact" ? 1.3 : spacingMode === "spacious" ? 1.8 : 1.5}
                  sectionLabels={(() => { const f = Object.fromEntries(Object.entries(customSectionLabels).filter(([,v]) => v.trim())); return Object.keys(f).length > 0 ? f as any : undefined; })()}
                />
              </div>

              {/* ATS Score Insight */}
              {computeAtsScore > 0 && (
                <div className="w-[80%] my-8">
                  <div className={\`rounded-2xl p-4 backdrop-blur-md flex items-start gap-4 border \${
                    computeAtsScore >= 70 ? "bg-green-50 border-green-200" :
                    computeAtsScore >= 40 ? "bg-amber-50 border-amber-200" :
                    "bg-red-50 border-red-200"
                  }\`}>
                    <div className={\`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 \${
                      computeAtsScore >= 70 ? "bg-green-100" :
                      computeAtsScore >= 40 ? "bg-amber-100" :
                      "bg-red-100"
                    }\`}>
                      <span className={\`material-symbols-outlined \${
                        computeAtsScore >= 70 ? "text-green-700" :
                        computeAtsScore >= 40 ? "text-amber-700" :
                        "text-red-700"
                      }\`} style={{ fontVariationSettings: \"'FILL' 1\" }}>
                        {computeAtsScore >= 70 ? "check_circle" : computeAtsScore >= 40 ? "trending_up" : "warning"}
                      </span>
                    </div>
                    <div>
                      <h5 className="text-sm font-label-bold text-on-surface mb-0.5">
                        ATS Score: {computeAtsScore}% — {computeAtsScore >= 70 ? "CV Siap Lamar!" : computeAtsScore >= 40 ? "Perlu Optimalisasi" : "Butuh Perbaikan Besar"}
                      </h5>
                      <p className="text-xs text-on-surface-variant">
                        {computeAtsScore < 40 ? "Tambahkan kata kunci dari deskripsi pekerjaan ke dalam pengalaman dan skill kamu." :
                          computeAtsScore < 70 ? "Beberapa kata kunci masih kurang. Gunakan fitur Saran AI atau Optimalkan di tiap deskripsi pekerjaan." :
                          "CV kamu sudah sangat cocok dengan deskripsi pekerjaan. Siap dilanjutkan ke tahap melamar!"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>`;

if (c.includes(rightPanelPlaceholder)) {
  c = c.replace(rightPanelPlaceholder, fullRightPanel);
  console.log('✓ Replaced right panel placeholder with full content');
} else {
  console.log('! Right panel placeholder pattern not found, trying alternative...');
  // Try just matching the placeholder text
  const altPattern = `Right panel content needs full reconstruction`;
  if (c.includes(altPattern)) {
    // Find the parent div and replace it
    console.log('  Found via alt text, manual fix needed');
  }
}

/* ─────────────────────────────────────────────────────
   STEP 4: Enhance BOTTOM NAV with quick-jump dock + keyboard hints
   ───────────────────────────────────────────────────── */
const basicBottomNav = `        {/* BOTTOM NAV */}
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
        </div>`;

const enhancedBottomNav = `        {/* ── BOTTOM NAV ── */}
        <div className="sticky bottom-0 bg-white border-t border-outline-variant/30 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] z-30">
          <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-3">
            {/* Section Quick-Jump Dock */}
            <div className="hidden sm:flex items-center justify-center gap-1 mb-3">
              {steps.map((label, i) => {
                const isFilled = sectionCompletion[i];
                const isActive = i === activeStep;
                const iconNames = ["person", "work_history", "work", "school", "groups", "star", "visibility"];
                return (
                  <button
                    key={label}
                    onClick={() => setActiveStep(i)}
                    className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all \${
                      isActive ? "bg-primary text-on-primary shadow-sm" :
                      isFilled ? "bg-green-50 text-green-700 hover:bg-green-100" :
                      "bg-surface-container-low text-outline hover:bg-surface-container"
                    }\`}
                  >
                    <span className={\`material-symbols-outlined text-[14px] \${isFilled && !isActive ? "text-green-600" : ""}\`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {isFilled ? "check_circle" : iconNames[i]}
                    </span>
                    <span className="hidden md:inline">{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Prev / Next / Save row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {activeStep > 0 && (
                  <MagneticButton>
                    <button type="button" onClick={() => setActiveStep((s) => s - 1)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-outline/30 text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">chevron_left</span>
                      <span className="hidden sm:inline">Sebelumnya</span>
                      <kbd className="hidden md:inline-flex text-[8px] font-bold text-outline/60 bg-outline-variant/20 px-1 py-0.5 rounded ml-1 border border-outline-variant/30">Ctrl+\u2190</kbd>
                    </button>
                  </MagneticButton>
                )}
              </div>

              {/* Mobile quick-jump */}
              <div className="flex sm:hidden items-center gap-1">
                {steps.map((_, i) => (
                  <button key={i} onClick={() => setActiveStep(i)}
                    className={\`w-6 h-6 rounded-full text-[10px] font-bold transition-all \${
                      i === activeStep ? "bg-primary text-on-primary scale-110" :
                      sectionCompletion[i] ? "bg-green-100 text-green-700" :
                      "bg-surface-container-high text-outline"
                    }\`}
                  >
                    {sectionCompletion[i] ? "\u2713" : i + 1}
                  </button>
                ))}
              </div>

              <div>
                {activeStep < 6 ? (
                  <MagneticButton>
                    <button type="button" onClick={() => setActiveStep((s) => s + 1)}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-medium hover:brightness-110 transition-all active:scale-95"
                    >
                      <span className="hidden sm:inline">Selanjutnya</span>
                      <kbd className="hidden md:inline-flex text-[8px] font-bold text-outline/60 bg-outline-variant/20 px-1 py-0.5 rounded ml-1 border border-outline-variant/30">Ctrl+\u2192</kbd>
                      <span className="material-symbols-outlined text-base">chevron_right</span>
                    </button>
                  </MagneticButton>
                ) : (
                  <MagneticButton>
                    <button type="button" onClick={handleSave} disabled={isSaving}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-base">save</span>
                      {isSaving ? "Menyimpan\u2026" : "Simpan CV"}
                      <kbd className="hidden md:inline-flex text-[8px] font-bold text-outline/60 bg-outline-variant/20 px-1 py-0.5 rounded ml-1 border border-outline-variant/30">Ctrl+Enter</kbd>
                    </button>
                  </MagneticButton>
                )}
              </div>
            </div>
          </div>
        </div>`;

if (c.includes(basicBottomNav)) {
  c = c.replace(basicBottomNav, enhancedBottomNav);
  console.log('✓ Enhanced bottom nav with quick-jump dock + keyboard hints');
} else {
  console.log('! Bottom nav pattern not found');
}

/* ─────────────────────────────────────────────────────
   STEP 5: Add modals (before closing </AuthGuard>)
   ───────────────────────────────────────────────────── */
const closingAuthGuard = `      </div>
    </AuthGuard>
  );`;

const modalsBlock = `
      {/* ── Tambah Section Step Modal ── */}
      <Modal open={showAddSectionStepModal} onClose={() => setShowAddSectionStepModal(false)} title="Tambah Section Baru" size="max-w-md">
        <div className="space-y-5 pt-2">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-primary/5 border border-primary/10">
            <span className="material-symbols-outlined text-primary shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Section kustom seperti <strong>Key Achievement</strong>, Sertifikasi, atau Publikasi
              sangat dilirik HR dan sistem ATS. Setelah menambahkan, kamu bisa mengisi kontennya.
            </p>
          </div>
          <div>
            <label className="block text-label-bold text-on-surface mb-1.5">Nama Section</label>
            <input type="text" value={newSectionName} onChange={(e) => setNewSectionName(e.target.value)}
              placeholder="Misal: Key Achievement, Sertifikasi, Proyek..."
              className="w-full bg-surface-container-low border-none rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-label-bold text-on-surface mb-2">Tipe Layout</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setNewSectionLayout("list")} className={'text-left p-3 rounded-xl border-2 transition-all ' + (newSectionLayout === 'list' ? 'border-primary bg-primary/5 shadow-sm' : 'border-outline-variant/30 bg-white hover:border-primary/30 hover:bg-surface-container-low')}>
                <span className="material-symbols-outlined text-lg text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>format_list_bulleted</span>
                <p className="text-sm font-semibold text-on-surface mt-1">Bullet List</p>
                <p className="text-[10px] text-on-surface-variant mt-0.5 leading-tight">Cocok untuk achievement &amp; tanggung jawab</p>
              </button>
              <button onClick={() => setNewSectionLayout("text")} className={'text-left p-3 rounded-xl border-2 transition-all ' + (newSectionLayout === 'text' ? 'border-primary bg-primary/5 shadow-sm' : 'border-outline-variant/30 bg-white hover:border-primary/30 hover:bg-surface-container-low')}>
                <span className="material-symbols-outlined text-lg text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>text_fields</span>
                <p className="text-sm font-semibold text-on-surface mt-1">Text Block</p>
                <p className="text-[10px] text-on-surface-variant mt-0.5 leading-tight">Paragraf penuh, cocok untuk ringkasan</p>
              </button>
              <button onClick={() => setNewSectionLayout("table")} className={'text-left p-3 rounded-xl border-2 transition-all ' + (newSectionLayout === 'table' ? 'border-primary bg-primary/5 shadow-sm' : 'border-outline-variant/30 bg-white hover:border-primary/30 hover:bg-surface-container-low')}>
                <span className="material-symbols-outlined text-lg text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>table</span>
                <p className="text-sm font-semibold text-on-surface mt-1">Table</p>
                <p className="text-[10px] text-on-surface-variant mt-0.5 leading-tight">Baris &amp; kolom, cocok untuk data teknis</p>
              </button>
              <button onClick={() => setNewSectionLayout("keyvalue")} className={'text-left p-3 rounded-xl border-2 transition-all ' + (newSectionLayout === 'keyvalue' ? 'border-primary bg-primary/5 shadow-sm' : 'border-outline-variant/30 bg-white hover:border-primary/30 hover:bg-surface-container-low')}>
                <span className="material-symbols-outlined text-lg text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>data_array</span>
                <p className="text-sm font-semibold text-on-surface mt-1">Key-Value</p>
                <p className="text-[10px] text-on-surface-variant mt-0.5 leading-tight">Pasangan label: nilai, cocok untuk info cepat</p>
              </button>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowAddSectionStepModal(false)} className="flex-1 py-2.5 rounded-xl border border-outline-variant text-sm font-medium text-on-surface hover:bg-surface-container transition-all">Batal</button>
            <button onClick={addSectionFromStepper} disabled={!newSectionName.trim()} className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed">Tambah Section</button>
          </div>
        </div>
      </Modal>

      {/* ── Display Settings Modal ── */}
      <Modal open={showDisplaySettings} onClose={() => setShowDisplaySettings(false)} title="Pengaturan Tampilan CV" size="max-w-md">
        <div className="space-y-5 pt-2 max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
          <div>
            <label className="block text-label-bold text-on-surface mb-2">Tata Letak Header</label>
            <div className="flex gap-2">
              {([["centered", "Tengah"], ["left", "Kiri"]] as const).map(([val, label]) => (
                <button key={val} onClick={() => setHeaderLayout(val)}
                  className={\`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all \${headerLayout === val ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"}\`}
                >
                  <span className="material-symbols-outlined text-base align-middle mr-1">{val === "centered" ? "format_align_center" : "format_align_left"}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-label-bold text-on-surface mb-2">Warna Aksen</label>
            <div className="flex items-center gap-3">
              <input type="color" value={customPrimaryColor || (TEMPLATE_STYLES[selectedTemplateId]?.primary || "#111111")}
                onChange={(e) => setCustomPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-xl border border-outline-variant/30 cursor-pointer"
              />
              <input type="text" value={customPrimaryColor} onChange={(e) => setCustomPrimaryColor(e.target.value)}
                placeholder="Default template"
                className="flex-1 bg-surface-container-low border-none rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
              />
              {customPrimaryColor && (
                <button onClick={() => setCustomPrimaryColor("")} className="text-xs text-outline hover:text-on-surface transition-colors shrink-0">Reset</button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-label-bold text-on-surface mb-2">Kerapatan Baris</label>
            <div className="flex gap-2">
              {([["compact", "Rapat"], ["normal", "Normal"], ["spacious", "Longgar"]] as const).map(([val, label]) => (
                <button key={val} onClick={() => setSpacingMode(val)}
                  className={\`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all \${spacingMode === val ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"}\`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-label-bold text-on-surface mb-2">Visibilitas Section</label>
            <div className="space-y-1.5">
              {([
                { key: "summary", label: "Ringkasan Profesional" },
                { key: "experience", label: "Pengalaman Kerja" },
                { key: "education", label: "Pendidikan" },
                { key: "skills", label: "Keahlian" },
                { key: "organizations", label: "Organisasi & Proyek" },
              ] as const).map((sec) => (
                <label key={sec.key} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 cursor-pointer hover:bg-surface-container transition-colors">
                  <span className="text-sm font-medium text-on-surface">{sec.label}</span>
                  <div className="relative">
                    <input type="checkbox" checked={sectionVisibility[sec.key] !== false}
                      onChange={() => setSectionVisibility(prev => ({ ...prev, [sec.key]: !prev[sec.key] }))}
                      className="peer sr-only"
                    />
                    <div className="w-9 h-5 rounded-full bg-outline-variant/40 peer-checked:bg-primary transition-colors duration-200 cursor-pointer after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:after:translate-x-4" />
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Section Order Modal ── */}
      <Modal open={showSectionOrderModal} onClose={() => setShowSectionOrderModal(false)} title="Atur Urutan Section" size="max-w-sm">
        <div className="space-y-3 pt-2" role="list">
          {sectionOrder.map((key, i) => {
            const isPredefined = key in TEMPLATE_STYLES || ["summary","experience","education","skills","organizations"].includes(key as string);
            const label = key;
            return (
              <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/20" role="listitem">
                <span className="material-symbols-outlined text-outline text-base cursor-grab">drag_indicator</span>
                <span className="text-sm font-medium text-on-surface flex-1">{label}</span>
                <div className="flex gap-1">
                  <button onClick={() => { if (i > 0) { const arr = [...sectionOrder]; [arr[i-1], arr[i]] = [arr[i], arr[i-1]]; setSectionOrder(arr); } }}
                    disabled={i === 0}
                    className="p-1 rounded hover:bg-white disabled:opacity-30 transition-colors" aria-label="Pindah ke atas"
                  >
                    <span className="material-symbols-outlined text-sm">keyboard_arrow_up</span>
                  </button>
                  <button onClick={() => { if (i < sectionOrder.length - 1) { const arr = [...sectionOrder]; [arr[i], arr[i+1]] = [arr[i+1], arr[i]]; setSectionOrder(arr); } }}
                    disabled={i === sectionOrder.length - 1}
                    className="p-1 rounded hover:bg-white disabled:opacity-30 transition-colors" aria-label="Pindah ke bawah"
                  >
                    <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* ── Custom Sections Content Modal ── */}
      <Modal open={showCustomSectionsModal} onClose={() => setShowCustomSectionsModal(false)} title="Section Kustom" size="max-w-lg">
        <div className="space-y-4 pt-2">
          {customSections.length === 0 && (
            <div className="text-center py-8 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl block mb-2">add_box</span>
              <p className="text-sm">Belum ada section kustom. Tambahkan lewat tombol <strong>+ Section</strong> di toolbar.</p>
            </div>
          )}
          {customSections.map((cs) => (
            <div key={cs.id} className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
              <div className="flex items-center justify-between mb-3">
                <input type="text" value={cs.title} onChange={(e) => updateCustomSection(cs.id, "title", e.target.value)}
                  className="font-label-bold text-sm bg-transparent border-none focus:outline-none w-full" placeholder="Nama section..."
                />
                <button onClick={() => removeCustomSection(cs.id)} className="text-error/70 hover:text-error transition-colors shrink-0 ml-2" aria-label="Hapus section">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
              <div className="flex gap-2 mb-2">
                <button onClick={() => updateCustomSection(cs.id, "contentType", "bullets")}
                  className={\`px-3 py-1 rounded-lg text-[10px] font-semibold transition-all \${
                    cs.contentType === "bullets" ? "bg-primary text-on-primary" : "bg-white text-outline hover:bg-surface-container"
                  }\`}
                >Bullet</button>
                <button onClick={() => updateCustomSection(cs.id, "contentType", "paragraph")}
                  className={\`px-3 py-1 rounded-lg text-[10px] font-semibold transition-all \${
                    cs.contentType === "paragraph" ? "bg-primary text-on-primary" : "bg-white text-outline hover:bg-surface-container"
                  }\`}
                >Paragraf</button>
              </div>
              <textarea rows={4} value={cs.content} onChange={(e) => updateCustomSection(cs.id, "content", e.target.value)}
                className="w-full bg-white border border-outline-variant/30 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary resize-none"
                placeholder={cs.contentType === "paragraph" ? "Tulis paragraf..." : "Tulis bullet point, satu per baris..."}
              />
              {cs.contentType === "bullets" && cs.content && (
                <p className="text-[10px] text-outline mt-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">info</span>
                  {cs.content.split("\\\\n").filter(Boolean).length} bullet point
                </p>
              )}
            </div>
          ))}
          <button onClick={addCustomSection}
            className="w-full border-2 border-dashed border-outline/30 rounded-xl py-3 flex items-center justify-center gap-2 text-sm text-outline hover:border-primary/50 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-lg">add</span> Tambah Section Kustom
          </button>
        </div>
      </Modal>

      {/* ── AI Proposal Modal ── */}
      {aiModal.open && (
        <AIProposalModal
          open={aiModal.open}
          onClose={() => setAiModal((prev) => ({ ...prev, open: false }))}
          mode={aiModal.mode}
          title={aiModal.title}
          suggestions={aiModal.suggestions}
          original={aiModal.original}
          versions={aiModal.versions}
          explanation={aiModal.explanation}
          tip={aiModal.tip}
          onAccept={aiModal.onAccept}
        />
      )}
`;

// Find the closing of the main AuthGuard div structure
const closeAuthIdx = c.lastIndexOf(closingAuthGuard);
if (closeAuthIdx >= 0 && !c.includes('showAddSectionStepModal')) {
  c = c.substring(0, closeAuthIdx) + modalsBlock + c.substring(closeAuthIdx);
  console.log('✓ Added all modals (Add Section, Display Settings, Section Order, Custom Sections, AI Proposal)');
} else {
  console.log('! AuthGuard closing not found or modals already present');
}

/* ─────────────────────────────────────────────────────
   STEP 6: Add reducedMotion state
   ───────────────────────────────────────────────────── */
const reducedMotionState = `  /* ── Reduced motion preference ── */
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
`;

// Find the aiJdTriggered state and insert after it
if (!c.includes('reducedMotion')) {
  const jdTriggerIdx = c.indexOf('const [aiJdTriggered, setAiJdTriggered] = useState(false);');
  if (jdTriggerIdx >= 0) {
    c = c.substring(0, jdTriggerIdx + 'const [aiJdTriggered, setAiJdTriggered] = useState(false);'.length) + '\n' + reducedMotionState + c.substring(jdTriggerIdx + 'const [aiJdTriggered, setAiJdTriggered] = useState(false);'.length);
    console.log('✓ Added reducedMotion state + effect');
  }
}

// Also update the AI FAB ping animation to respect reduced motion
c = c.replace(
  '<span className="absolute inset-0 rounded-lg animate-ping opacity-30"',
  '<span className={\`absolute inset-0 rounded-lg \${reducedMotion ? "opacity-30" : "animate-ping"} opacity-30\`}'
);
console.log('✓ Added reduced-motion check to AI FAB ping');

/* ─────────────────────────────────────────────────────
   Write file
   ───────────────────────────────────────────────────── */
fs.writeFileSync(fp, c.replace(/\n/g, '\r\n'), 'utf8');
console.log('\n✅ File fully reconstructed!');
