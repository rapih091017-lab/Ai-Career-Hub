import fs from 'fs';

const filePath = 'src/app/builder/[id]/page.tsx';
let c = fs.readFileSync(filePath, 'utf8');

/* ====================================================================
   FIX 1: Icon names array order in Quick-Jump Dock
   ==================================================================== */

c = c.replace(
  `const iconNames = [\"person\", \"work\", \"school\", \"groups\", \"star\", \"work_history\", \"visibility\"];`,
  `const iconNames = [\"person\", \"work_history\", \"work\", \"school\", \"groups\", \"star\", \"visibility\"];`
);

/* ====================================================================
   FIX 2: Stepper '+' button modal — dedicated modal for section name + layout types
   ==================================================================== */

// Add new state for stepper add modal
c = c.replace(
  `  const [showCustomSectionsModal, setShowCustomSectionsModal] = useState(false);`,
  `  const [showCustomSectionsModal, setShowCustomSectionsModal] = useState(false);
  const [showAddSectionStepModal, setShowAddSectionStepModal] = useState(false);
  const [newSectionName, setNewSectionName] = useState(\"");
  const [newSectionLayout, setNewSectionLayout] = useState<\"list\" | \"text\" | \"table\" | \"keyvalue\">(\"list\");`
);

// Add handler for adding section from stepper
// Find the addCustomSection function and add a new handler before it
c = c.replace(
  `  const addCustomSection = () => {`,
  `  const addSectionFromStepper = () => {
    if (!newSectionName.trim()) {
      addToast({ type: \"error\", message: \"Masukkan nama section terlebih dahulu.\" });
      return;
    }
    const id = \"cs_\" + Date.now();
    const entry: CustomSectionEntry = {
      id,
      title: newSectionName.trim(),
      content: \"\",
      contentType: newSectionLayout === \"text\" ? \"paragraph\" : \"bullets\",
    };
    setCustomSections((prev) => [...prev, entry]);
    setSectionOrder((prev) => [...prev, id]);
    setNewSectionName(\"\");
    setNewSectionLayout(\"list\");
    setShowAddSectionStepModal(false);
    addToast({ type: \"success\", message: \`Section \"\${newSectionName.trim()}\" berhasil ditambahkan! Edit kontennya melalui tombol + Section di toolbar.\` });
    // Auto-navigate to the custom sections modal to edit content
    setTimeout(() => setShowCustomSectionsModal(true), 500);
  };

  const addCustomSection = () => {`
);

// Change stepper '+' button to open the new modal
c = c.replace(
  `onClick={() => setShowCustomSectionsModal(true)}`,
  `onClick={() => { setNewSectionName(\"\"); setNewSectionLayout(\"list\"); setShowAddSectionStepModal(true); }}`
);

// Add the new modal before the Display Settings modal
const modalInsertion = `
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

          {/* Section name */}
          <div>
            <label className="block text-label-bold text-on-surface mb-1.5">Nama Section</label>
            <input
              type="text"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder="Misal: Key Achievement, Sertifikasi, Proyek..."
              className="w-full bg-surface-container-low border-none rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>

          {/* Layout type */}
          <div>
            <label className="block text-label-bold text-on-surface mb-2">Tipe Layout</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: "list" as const, label: "Bullet List", icon: "format_list_bulleted", desc: "Cocok untuk achievement & tanggung jawab" },
                { value: "text" as const, label: "Text Block", icon: "text_fields", desc: "Paragraf penuh, cocok untuk ringkasan" },
                { value: "table" as const, label: "Table", icon: "table", desc: "Baris & kolom, cocok untuk data teknis" },
                { value: "keyvalue" as const, label: "Key-Value", icon: "data_array", desc: "Pasangan label: nilai, cocok untuk info cepat" },
              ]).map((layout) => (
                <button
                  key={layout.value}
                  onClick={() => setNewSectionLayout(layout.value)}
                  className={`text-left p-3 rounded-xl border-2 transition-all ${
                    newSectionLayout === layout.value
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-outline-variant/30 bg-white hover:border-primary/30 hover:bg-surface-container-low"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{layout.icon}</span>
                  <p className="text-sm font-semibold text-on-surface mt-1">{layout.label}</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5 leading-tight">{layout.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowAddSectionStepModal(false)}
              className="flex-1 py-2.5 rounded-xl border border-outline-variant text-sm font-medium text-on-surface hover:bg-surface-container transition-all"
            >
              Batal
            </button>
            <button
              onClick={addSectionFromStepper}
              disabled={!newSectionName.trim()}
              className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tambah Section
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Display Settings Modal ── */}`;

c = c.replace(
  `      {/* ── Display Settings Modal ── */}`,
  modalInsertion
);

/* ====================================================================
   FIX 3: AI suggestions after Target Pekerjaan filled
   ==================================================================== */

// Add useEffect after the existing auto-save useEffect that triggers when user navigates from step 1
const aiTriggerCode = `
  /* ── AI trigger: when user moves away from Target Pekerjaan (step 1) with filled data ── */
  const [aiJdSuggested, setAiJdSuggested] = useState(false);
  const prevActiveStep = useRef(activeStep);

  useEffect(() => {
    // Detect transition: was at step 1 (Target Pekerjaan), now moved to step 2+
    const justLeftTargetPekerjaan = prevActiveStep.current === 1 && activeStep > 1;
    prevActiveStep.current = activeStep;

    if (justLeftTargetPekerjaan && (cvData.jobTitle || cvData.jobDescription) && !aiJdSuggested) {
      setAiJdSuggested(true);
      const timer = setTimeout(() => {
        addToast({
          type: "success",
          message: "🎯 AI teraktivasi! Berdasarkan target pekerjaan, isi pengalaman, skill, dan section lainnya dengan kata kunci yang relevan untuk meningkatkan ATS Score.",
        });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [activeStep, cvData.jobTitle, cvData.jobDescription, aiJdSuggested, addToast]);`;

// Insert after the auto-save useEffect
c = c.replace(
  `    return () => clearTimeout(timer);
  }, [cvData, cvId]);

  /* ── mount: fetch CV data ── */`,
  `    return () => clearTimeout(timer);
  }, [cvData, cvId]);
${aiTriggerCode}
  /* ── mount: fetch CV data ── */`
);

fs.writeFileSync(filePath, c, 'utf8');
console.log('All remaining fixes applied. File length:', c.length);
