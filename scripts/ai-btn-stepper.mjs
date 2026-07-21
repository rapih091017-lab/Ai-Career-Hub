import fs from 'fs';

const filePath = 'src/app/builder/[id]/page.tsx';
let c = fs.readFileSync(filePath, 'utf8');

/* ====================================================================
   CHANGE 3: AI Revision button — Gradient FAB with pulse animation
   ==================================================================== */

// Replace the current "Beli AI Revision" button with a gradient FAB
const oldBtn = `              {/* Beli AI Revision */}
              <MagneticButton>
                <button
                  onClick={() => router.push(\`/cv/\${cvId}/checkout\`)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-secondary/10 text-secondary hover:bg-secondary/20 transition-all"
                  title="Beli AI Smart Revision untuk CV ini"
                >
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  <span className="hidden sm:inline">AI Rev</span>
                </button>
              </MagneticButton>`;

const newBtn = `              {/* AI Perbaiki — Gradient FAB */}
              <motion.button
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
                onClick={() => router.push(\`/cv/\${cvId}/checkout\`)}
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white shadow-lg hover:shadow-xl transition-all active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #00897B, #26A69A)",
                }}
                title="Perbaiki CV dengan AI Smart Revision"
              >
                <span className="relative flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  <span className="hidden sm:inline">Perbaiki AI</span>
                </span>
                {/* Pulse ring */}
                <span className="absolute inset-0 rounded-xl animate-ping bg-teal-400/30" style={{ animationDuration: "2s" }} />
              </motion.button>`;

c = c.replace(oldBtn, newBtn);

/* ====================================================================
   CHANGE 4: "+" button in stepper
   ==================================================================== */

// Add a "+" button after the last step in the stepper loop
// Find the closing of the stepper's steps.map and add a "+" button before the closing </div>
const stepperEnd = `            })}
          </div>
        </div>

        {/* ── WORKSPACE LAYOUT ── */}`;

const newStepperEnd = `            })}
              {/* + Tambah Section button */}
              <div className="flex items-center">
                <div className="h-0.5 w-6 md:w-10 shrink-0 bg-outline-variant" />
                <button
                  onClick={() => setShowCustomSectionsModal(true)}
                  className="flex items-center gap-1.5 px-1.5 md:px-2 py-1 rounded-lg transition-all shrink-0 hover:bg-surface-container-low"
                  title="Tambah section kustom"
                >
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold shrink-0 transition-all bg-amber-50 text-amber-600 border-2 border-dashed border-amber-300 hover:bg-amber-100 hover:border-amber-400">
                    <span className="material-symbols-outlined text-sm md:text-base">add</span>
                  </div>
                  <span className="text-xs whitespace-nowrap text-amber-600 font-medium hidden sm:inline">Tambah</span>
                </button>
              </div>
          </div>
        </div>

        {/* ── WORKSPACE LAYOUT ── */}`;

c = c.replace(stepperEnd, newStepperEnd);

// Also need to add motion import if not already present
// Check if motion is already imported
if (c.includes("import { motion, AnimatePresence } from \"motion/react\";")) {
  console.log('motion already imported');
} else {
  console.log('motion not imported - this should be handled');
}

fs.writeFileSync(filePath, c, 'utf8');
console.log('AI button + stepper applied. File length:', c.length);
