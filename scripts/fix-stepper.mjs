import fs from 'fs';

const fp = 'src/app/builder/[id]/page.tsx';
let c = fs.readFileSync(fp, 'utf8');

// 1. Add new state variables after showCustomSectionsModal
c = c.replace(
  '  const [showCustomSectionsModal, setShowCustomSectionsModal] = useState(false);',
  '  const [showCustomSectionsModal, setShowCustomSectionsModal] = useState(false);\n  const [showAddSectionStepModal, setShowAddSectionStepModal] = useState(false);\n  const [newSectionName, setNewSectionName] = useState("");\n  const [newSectionLayout, setNewSectionLayout] = useState<"list" | "text" | "table" | "keyvalue">("list");'
);

// 2. Change stepper '+' button to open new modal
c = c.replace(
  'onClick={() => setShowCustomSectionsModal(true)}',
  'onClick={() => { setNewSectionName(""); setNewSectionLayout("list"); setShowAddSectionStepModal(true); }}'
);

// 3. Add handler function before addCustomSection
c = c.replace(
  '  const addCustomSection = () => {',
  '  const addSectionFromStepper = () => {\n    if (!newSectionName.trim()) {\n      addToast({ type: "error", message: "Masukkan nama section terlebih dahulu." });\n      return;\n    }\n    const id = "cs_" + Date.now();\n    const entry = {\n      id,\n      title: newSectionName.trim(),\n      content: "",\n      contentType: newSectionLayout === "text" ? "paragraph" : "bullets",\n    };\n    setCustomSections((prev) => [...prev, entry]);\n    setSectionOrder((prev) => [...prev, id]);\n    setNewSectionName("");\n    setNewSectionLayout("list");\n    setShowAddSectionStepModal(false);\n    addToast({ type: "success", message: \'Section "\' + newSectionName.trim() + \'" berhasil ditambahkan! Edit kontennya lewat tombol + Section di toolbar.\' });\n    setTimeout(() => setShowCustomSectionsModal(true), 500);\n  };\n\n  const addCustomSection = () => {'
);

// 4. Add the modal JSX after Custom Sections Modal
// Find the end of Custom Sections modal and add new modal before Display Settings
const modalContent = `      {/* ── Tambah Section Step Modal ── */}
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
            <input
              type="text"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
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

      {/* ── Display Settings Modal ── */}`;

c = c.replace('      {/* ── Display Settings Modal ── */}', modalContent);

fs.writeFileSync(fp, c, 'utf8');
console.log('Stepper modal added. Length:', c.length);
