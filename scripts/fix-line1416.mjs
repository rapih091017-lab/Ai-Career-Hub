import fs from 'fs';
const fp = 'src/app/builder/[id]/page.tsx';
let c = fs.readFileSync(fp, 'utf8');
c = c.replace(/\r\n/g, '\n');

// Find line 1416 (0-indexed: 1415)
const lines = c.split('\n');
const l = lines[1415];
console.log('Line 1416:', JSON.stringify(l));
console.log('Line 1416 length:', l.length);

// Problem: the double-dash in "--" is being interpreted as decrement operator
// Replace the entire line with a clean version
const cleanLine = '                        <span className="text-outline">{cvData.fullName || "\\u2014"}</span>';
lines[1415] = cleanLine;
console.log('Replaced with:', JSON.stringify(cleanLine));

c = lines.join('\n');
fs.writeFileSync(fp, c.replace(/\n/g, '\r\n'), 'utf8');
console.log('Done');
