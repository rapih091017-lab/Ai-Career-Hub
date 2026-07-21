import fs from 'fs';

const fp = 'src/app/builder/[id]/page.tsx';
let c = fs.readFileSync(fp, 'utf8');
c = c.replace(/\r\n/g, '\n');

let count = 0;

// ===== CHANGE 3: Collapse/Expand All button =====
// Find the activeStep === 2 (work history) section and add a toggle button
// Look for the start of activeStep === 2 content
const step2Start = '{activeStep === 2 && (\n                <div className="space-y-4">\n                  {cvData.workHistory.map((work, i) => {';
// After the opening div of step 2, add the collapse/expand all button
const step2Insert = '{activeStep === 2 && (\n                <div className="space-y-4">\n                  {/* Collapse/Expand All */}\n                  {cvData.workHistory.length > 1 && (\n                    <div className="flex items-center justify-end mb-2">\n                      <button\n                        type="button"\n                        onClick={() => {\n                          setCollapsedWorkIds((prev) => {\n                            if (prev.size === cvData.workHistory.length) {\n                              return new Set();\n                            }\n                            return new Set(cvData.workHistory.map((w) => w.id));\n                          });\n                        }}\n                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-outline hover:text-on-surface hover:bg-surface-container transition-all"\n                      >\n                        <span className="material-symbols-outlined text-[14px]">unfold_more</span>\n                        {collapsedWorkIds.size === cvData.workHistory.length ? "Buka Semua" : "Ciutkan Semua"}\n                      </button>\n                    </div>\n                  )}\n                  {cvData.workHistory.map((work, i) => {';

if (c.includes(step2Start)) {
  c = c.replace(step2Start, step2Insert);
  count++;
  console.log('✓ Collapse/Expand All button added');
} else {
  console.log('! Could not find work history section start');
}

// ===== CHANGE 5: Enhanced Field component with validation =====
// Replace the inline Field function at the bottom with an enhanced version
const oldField = `function Field({ label, type = "text", value, onChange, disabled }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-label-bold text-on-surface mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
        className="w-full bg-surface-container-low border-none rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary text-body-md disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}`;

const newField = `function Field({ label, type = "text", value, onChange, disabled, required, placeholder }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; disabled?: boolean; required?: boolean; placeholder?: string;
}) {
  const isEmpty = required && !value && value !== undefined;
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
          className={\`w-full rounded-xl px-3 py-2 text-body-md transition-all duration-200 \${
            isEmpty
              ? "bg-red-50 border border-red-300 focus:ring-2 focus:ring-red-400"
              : value
              ? "bg-surface-container-low border border-transparent focus:ring-2 focus:ring-primary"
              : "bg-surface-container-low border border-transparent focus:ring-2 focus:ring-primary"
          } disabled:opacity-50 disabled:cursor-not-allowed\`}
        />
        {value && !disabled && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </span>
        )}
      </div>
    </div>
  );
}`;

if (c.includes(oldField)) {
  c = c.replace(oldField, newField);
  count++;
  console.log('✓ Enhanced Field component added');
} else {
  console.log('! Could not find Field component');
}

// ===== CHANGE 5: Section completion celebration ===== 
// Add a subtle success animation when section is completed
// Find the review step summary and enhance it with animated checkmarks
const reviewSectionStart = '{activeStep === 6 && (\n                <div className="space-y-5">\n                  <div className="bg-white rounded-[20px] p-6 shadow-soft space-y-3">\n                    <h3 className="font-label-bold text-on-surface">Ringkasan CV</h3>';
const enhancedReview = `{activeStep === 6 && (\n                <div className="space-y-5">\n                  {/* Completion Score */}\n                  <div className="bg-white rounded-[20px] p-6 shadow-soft space-y-4">\n                    <div className="flex items-center justify-between">\n                      <h3 className="font-label-bold text-on-surface">Ringkasan CV</h3>\n                      <div className="flex items-center gap-1.5">\n                        <div className="flex">\n                          {[0,1,2,3,4,5].map((idx) => (\n                            <div key={idx} className={\`w-5 h-1 rounded-full transition-all duration-500 \${
                              sectionCompletion[idx] ? "bg-primary" : "bg-outline-variant/50"
                            } ml-0.5 first:ml-0\`} />\n                          ))}\n                        </div>\n                        <span className="text-[10px] font-bold text-primary">{sectionCompletion.filter(Boolean).length}/6</span>\n                      </div>\n                    </div>`;

if (c.includes(reviewSectionStart)) {
  c = c.replace(reviewSectionStart, enhancedReview);
  count++;
  console.log('✓ Review section enhanced with completion progress bar');
} else {
  console.log('! Could not find review section start');
}

fs.writeFileSync(fp, c.replace(/\n/g, '\r\n'), 'utf8');
console.log(`\\nDone - ${count}/3 changes applied`);
