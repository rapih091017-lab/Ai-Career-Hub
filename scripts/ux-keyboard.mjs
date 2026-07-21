import fs from 'fs';

const fp = 'src/app/builder/[id]/page.tsx';
let c = fs.readFileSync(fp, 'utf8');
c = c.replace(/\r\n/g, '\n');

// Add keyboard shortcut effect after the AI trigger effect
// Find the pattern: closing of ai trigger effect + blank line + loading/error
const insertBefore = '  /* ── loading / error ── */';

const keyboardShortcuts = `  /* ── Keyboard Shortcuts ── */
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
  }, [handleSave]);

`;

if (c.includes(insertBefore)) {
  c = c.replace(insertBefore, keyboardShortcuts + insertBefore);
  console.log('✓ Keyboard shortcuts added');
} else {
  console.log('! Insertion point not found');
}

fs.writeFileSync(fp, c.replace(/\n/g, '\r\n'), 'utf8');
console.log('Done');
