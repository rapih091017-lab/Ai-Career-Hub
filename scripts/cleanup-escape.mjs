import fs from 'fs';
const fp = 'src/app/builder/[id]/page.tsx';
let c = fs.readFileSync(fp, 'utf8');

// Remove Node.js template literal escaping artifacts
// Replace literal '\$' with '$' and '\`' with '`'
// These were introduced because the Node.js script used template
// literals with \$ and \` which Node.js didn't properly escape

// First, normalize line endings
c = c.replace(/\r\n/g, '\n');

// Fix: replace escaped backslash-dollar sequences that were meant to be literal ${} in JSX
// The script had things like `\${...}` which Node.js interpreted as `${...}` interpolation
// But some \ were preserved by accident
c = c.replace(/\\(\$)/g, '$1');  // \$ -> $
c = c.replace(/\\(`)/g, '$1');   // \` -> `

// Also remove any "undefined" that was interpolated
c = c.replace(/undefined/g, '');

fs.writeFileSync(fp, c.replace(/\n/g, '\r\n'), 'utf8');
console.log('Cleaned escaping artifacts');
console.log('New size:', c.length, 'chars');
