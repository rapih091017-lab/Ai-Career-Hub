import fs from 'fs';

const fp = 'src/app/builder/[id]/page.tsx';
let c = fs.readFileSync(fp, 'utf8');
c = c.replace(/\r\n/g, '\n');

let count = 0;

// Change 1: Add shortcut hint to "Sebelumnya" button (Previous)
const oldPrev = `<span className="hidden sm:inline">Sebelumnya</span>
                    </button>
                  </MagneticButton>
                )}`;
const newPrev = `<span className="hidden sm:inline">Sebelumnya</span>
                      <kbd className="hidden md:inline-flex text-[8px] font-bold text-outline/60 bg-outline-variant/20 px-1 py-0.5 rounded ml-1 border border-outline-variant/30">Ctrl+←</kbd>
                    </button>
                  </MagneticButton>
                )}`;
if (c.includes(oldPrev)) {
  c = c.replace(oldPrev, newPrev);
  count++;
  console.log('✓ Previous button shortcut hint added');
}

// Change 2: Add shortcut hint to "Selanjutnya" button (Next)
const oldNext = `<span className="hidden sm:inline">Selanjutnya</span>
                      <span className="material-symbols-outlined text-base">chevron_right</span>
                    </button>
                  </MagneticButton>
                ) : (
                  <MagneticButton>`;
const newNext = `<span className="hidden sm:inline">Selanjutnya</span>
                      <kbd className="hidden md:inline-flex text-[8px] font-bold text-outline/60 bg-outline-variant/20 px-1 py-0.5 rounded ml-1 border border-outline-variant/30">Ctrl+→</kbd>
                      <span className="material-symbols-outlined text-base">chevron_right</span>
                    </button>
                  </MagneticButton>
                ) : (
                  <MagneticButton>`;
if (c.includes(oldNext)) {
  c = c.replace(oldNext, newNext);
  count++;
  console.log('✓ Next button shortcut hint added');
}

// Change 3: Add shortcut hint to "Simpan CV" button (Save)
const oldSave = `<span className="material-symbols-outlined text-base">save</span>
                      {isSaving ? "Menyimpan…" : "Simpan CV"}`;
const newSave = `<span className="material-symbols-outlined text-base">save</span>
                      {isSaving ? "Menyimpan…" : "Simpan CV"}
                      <kbd className="hidden md:inline-flex text-[8px] font-bold text-outline/60 bg-outline-variant/20 px-1 py-0.5 rounded ml-1 border border-outline-variant/30">Ctrl+Enter</kbd>`;
if (c.includes(oldSave)) {
  c = c.replace(oldSave, newSave);
  count++;
  console.log('✓ Save button shortcut hint added');
}

// Change 4: Stepper tooltip enhancement - make step circles show section name on hover
// Add title prop to step buttons with section description
const oldStepBtn = `<button
                    onClick={() => setActiveStep(i)}
                    className="flex items-center gap-1.5 md:gap-2 px-1.5 md:px-2 py-1 rounded-lg transition-all shrink-0 hover:bg-surface-container-low"
                  >
                    <div`;
const newStepBtn = `<button
                    onClick={() => setActiveStep(i)}
                    title={sectionMeta[i]?.desc || ""}
                    className="flex items-center gap-1.5 md:gap-2 px-1.5 md:px-2 py-1 rounded-lg transition-all shrink-0 hover:bg-surface-container-low"
                  >
                    <div`;
if (c.includes(oldStepBtn)) {
  c = c.replace(oldStepBtn, newStepBtn);
  count++;
  console.log('✓ Stepper tooltips added');
}

fs.writeFileSync(fp, c.replace(/\n/g, '\r\n'), 'utf8');
console.log(`\nDone - ${count}/4 changes applied`);
