import fs from 'fs';

const fp = 'src/app/builder/[id]/page.tsx';
let c = fs.readFileSync(fp, 'utf8');

c = c.replace(
  'const iconNames = ["person", "work", "school", "groups", "star", "work_history", "visibility"];',
  'const iconNames = ["person", "work_history", "work", "school", "groups", "star", "visibility"];'
);

fs.writeFileSync(fp, c, 'utf8');
console.log('iconNames fixed. Length:', c.length);
