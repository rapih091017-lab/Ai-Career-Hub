import fs from 'fs';

const fp = 'src/app/builder/[id]/page.tsx';
let c = fs.readFileSync(fp, 'utf8');
c = c.replace(/\r\n/g, '\n');

let count = 0;

// Fix 1: Handle save with ref-based pattern + isSaving guard
const oldShortcuts = `  /* ── Keyboard Shortcuts ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+Enter → Save
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
      // Ctrl+ArrowLeft → Previous step
      if (e.ctrlKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveStep((s) => Math.max(0, s - 1));
      }
      // Ctrl+ArrowRight → Next step
      if (e.ctrlKey && e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveStep((s) => Math.min(6, s + 1));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);`;

const newShortcuts = `  /* ── Keyboard Shortcuts ── */
  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;
  const isSavingRef = useRef(isSaving);
  isSavingRef.current = isSaving;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+Enter → Save (with guard against double-save)
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (!isSavingRef.current) {
          handleSaveRef.current();
        }
      }
      // Ctrl+ArrowLeft → Previous step
      if (e.ctrlKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveStep((s) => Math.max(0, s - 1));
      }
      // Ctrl+ArrowRight → Next step
      if (e.ctrlKey && e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveStep((s) => Math.min(6, s + 1));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);`;

if (c.includes(oldShortcuts)) {
  c = c.replace(oldShortcuts, newShortcuts);
  count++;
  console.log('✓ Fixed keyboard shortcuts - ref pattern + isSaving guard');
} else {
  console.log('! Keyboard shortcuts pattern not found');
}

// Fix 2: Change collapse/expand icon based on state
const oldCollapseIcon = `className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-outline hover:text-on-surface hover:bg-surface-container transition-all"
                      >
                        <span className="material-symbols-outlined text-[14px]">unfold_more</span>`;
const newCollapseIcon = `className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-outline hover:text-on-surface hover:bg-surface-container transition-all"
                      >
                        <span className="material-symbols-outlined text-[14px]">{collapsedWorkIds.size === cvData.workHistory.length ? "unfold_more" : "unfold_less"}</span>`;

if (c.includes(oldCollapseIcon)) {
  c = c.replace(oldCollapseIcon, newCollapseIcon);
  count++;
  console.log('✓ Fixed collapse icon - dynamic unfold_more/unfold_less');
} else {
  console.log('! Collapse icon pattern not found');
}

// Fix 3: Show green checkmark only for required fields
const oldCheck = `{value && !disabled && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </span>
        )}`;
const newCheck = `{value && !disabled && required && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </span>
        )}`;

if (c.includes(oldCheck)) {
  c = c.replace(oldCheck, newCheck);
  count++;
  console.log('✓ Fixed green check - only shows for required fields');
} else {
  console.log('! Check icon pattern not found');
}

fs.writeFileSync(fp, c.replace(/\n/g, '\r\n'), 'utf8');
console.log(`\\nDone - ${count}/3 polish fixes applied`);
