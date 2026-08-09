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
// Upsert user test
const email = process.argv[2] || 'test.surat@example.com';
const [user] = await sql`
  insert into users (id, name, email, status, created_at)
  values (gen_random_uuid(), 'User Test Surat', ${email}, 'active', now())
  on conflict (email) do update set status = 'active'
  returning id
`;
console.log('USER_ID=' + user.id);
console.log('EMAIL=' + email);
await sql.end();
