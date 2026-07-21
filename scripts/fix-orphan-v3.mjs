import fs from 'fs';

const fp = 'src/app/builder/[id]/page.tsx';
let c = fs.readFileSync(fp, 'utf8');

// Normalize CRLF
c = c.replace(/\r\n/g, '\n');

// The fix: find the broken pattern and restore the correct structure
// Current: ...</p>\n                      </div>\n                  </div>\n                </div>\n              )}\n\n              {activeStep === 2
// Should be: ...</p>\n                      </div>\n                    )}\n                </div>\n              )}\n\n              {activeStep === 2

const oldPattern = `                        </p>\n                      </div>\n                  </div>\n                </div>\n              )}\n\n              {activeStep === 2`;
const newPattern = `                        </p>\n                      </div>\n                    )}\n                </div>\n              )}\n\n              {activeStep === 2`;

if (c.includes(oldPattern)) {
  c = c.replace(oldPattern, newPattern);
  console.log('✓ Orphan div removed and missing closing restored');
} else {
  console.log('! Pattern not found');
  // Debug: show context
  const idx = c.indexOf('{activeStep === 2');
  if (idx > 0) {
    console.log('Context (200 chars before activeStep === 2):');
    console.log(JSON.stringify(c.slice(idx - 200, idx)));
  }
}

fs.writeFileSync(fp, c.replace(/\n/g, '\r\n'), 'utf8');
console.log('Done');
