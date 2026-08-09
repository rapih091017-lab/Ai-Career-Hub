import postgres from 'postgres';
import { readFileSync } from 'fs';
function loadEnv(paths) {
  const out = {};
  for (const p of paths) {
    try {
      const txt = readFileSync(p, 'utf8');
      for (const line of txt.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
        if (!m) continue;
        let val = m[2];
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
        out[m[1]] = val;
      }
    } catch {}
  }
  return out;
}
const env = loadEnv(['.env.local', '.env', '.env.production']);
const sql = postgres(env.DATABASE_URL || env.DATABASE_URI || env.POSTGRES_URL || env.DBURL);
await sql`delete from cover_letters where user_id in (select id from users where email like 'test.%@example.com')`;
await sql`delete from users where email like 'test.%@example.com'`;
const [n] = await sql`select count(*)::int as c from users where email like 'test.%@example.com'`;
console.log('Sisa user test: ' + n.c);
await sql.end();
