import fs from 'fs';

const fp = 'src/app/builder/[id]/page.tsx';
let c = fs.readFileSync(fp, 'utf8').replace(/\r\n/g, '\n');

let fixes = 0;

/* ═══════════════════════════════════════════════════
   FIX 1: Move aiJdTriggered reset effect AFTER state declaration
   ═══════════════════════════════════════════════════ */
// The reset effect references aiJdTriggered but was inserted before the state declaration
// Move it to after the state declarations

const resetEffectStart = `  /* ── Reset AI trigger when Target Pekerjaan data changes ── */
  useEffect(() => {
    if (aiJdTriggered && (activeStep === 1 || prevActiveStep.current === 1)) {
      setAiJdTriggered(false);
    }
  }, [cvData.jobTitle, cvData.jobDescription, aiJdTriggered, activeStep]);

`;

const aiTriggerSection = `  /* ── AI Trigger: generate suggestions after Target Pekerjaan filled ── */`;
const stateLine = `  const [aiJdTriggered, setAiJdTriggered] = useState(false);`;

// Find and remove the reset effect
const resetIdx = c.indexOf(resetEffectStart);
if (resetIdx >= 0) {
  c = c.replace(resetEffectStart, '');
  fixes++;
  console.log('✓ Removed misplaced aiJdTriggered reset effect');
}

// Find the aiJdTriggered state declaration and insert reset effect after it
const stateIdx = c.indexOf(stateLine);
if (stateIdx >= 0 && resetIdx >= 0) {
  const insertPos = stateIdx + stateLine.length;
  c = c.substring(0, insertPos) + '\n' + resetEffectStart + c.substring(insertPos);
  fixes++;
  console.log('✓ Inserted reset effect after state declaration');
} else {
  console.log('! Could not find aiJdTriggered state declaration');
}

/* ═══════════════════════════════════════════════════
   FIX 2: Add Field component definition at end of file
   ═══════════════════════════════════════════════════ */
// The Field component was at the END of the original file, before export
// Find the end of the component and add Field definition before it

const fieldComponent = `
/* ───────── Field Component ───────── */

function Field({ label, type = "text", value, onChange, disabled, required, placeholder }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; disabled?: boolean; required?: boolean; placeholder?: string;
}) {
  const isEmpty = required && !value;
  const isFilled = !!value && !disabled;
  return (
    <div>
      <label className="block text-label-bold text-on-surface mb-1.5">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={\`w-full bg-surface-container-low border-none rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary text-body-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 \${
            isEmpty ? "ring-2 ring-red-300 bg-red-50" : ""
          }\`}
        />
        {isFilled && required && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </span>
        )}
      </div>
    </div>
  );
}
`;

// Find the end of file: look for export default or the closing tag of BuilderPage
const exportLine = `export default function BuilderPage() {`;
// Actually, it's just `export default BuilderPage;` or similar
// Let me find the last occurrence of '}' that closes BuilderPage

// Look for the app closing. In the reconstructed file, the file ends with:
// `    </AuthGuard>\n  );\n}\n`
const fileEnd = '    </AuthGuard>\n  );\n}\n';
const endIdx = c.lastIndexOf(fileEnd);

if (endIdx >= 0) {
  // Check if Field is already defined
  if (!c.includes('function Field(')) {
    c = c.substring(0, endIdx + fileEnd.length) + '\n' + fieldComponent + '\n';
    fixes++;
    console.log('✓ Added Field component definition');
  } else {
    console.log('! Field component already exists');
  }
} else {
  console.log('! Could not find file end marker');
}

/* ═══════════════════════════════════════════════════
   FIX 3: Fix implicit any types for parameters
   ═══════════════════════════════════════════════════ */
// After adding Field component, the implicit any errors should resolve
// because the Field function is properly typed

// Write file
fs.writeFileSync(fp, c.replace(/\n/g, '\r\n'), 'utf8');
console.log(`\n✅ ${fixes} fixes applied`);
