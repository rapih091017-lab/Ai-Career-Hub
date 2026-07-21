import fs from 'fs';

const filePath = 'src/app/builder/[id]/page.tsx';
let c = fs.readFileSync(filePath, 'utf8');

// Remove the CV Language section (from {/* CV Language */} to the end of its parent div)
// Match the Language selector div including the info text
const langRegex = /                  \/\* CV Language \*\/[\s\S]*?Section headers, labels, dan tanggal akan tampil sesuai bahasa yang dipilih[\s\S]*?<\/div>\s*\n                  <div>/;

c = c.replace(langRegex, `                  <div>`);

// Also remove the cvLang related code from emptyCvData if present
// Keep cvLang in CvData type but just remove from the step

fs.writeFileSync(filePath, c, 'utf8');
console.log('Language field removed. File length:', c.length);
