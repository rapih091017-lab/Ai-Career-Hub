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
const email = 'test.cv@example.com';
const [user] = await sql`insert into users (id, name, email, status, created_at) values (gen_random_uuid(), 'User CV Test', ${email}, 'active', now()) on conflict (email) do update set status='active' returning id`;
const [mp] = await sql`insert into master_profiles (id, user_id, personal_info, work_history, created_at) values (gen_random_uuid(), ${user.id}, jsonb_build_object('fullName','Budi CV','email','budi@cv.com','phone','0812','address','Jakarta'), jsonb_build_array(jsonb_build_object('position','Frontend Dev','company','PT ABC','startDate','2021','endDate','2024','description','membangun UI')), now()) returning id`;
const [cv] = await sql`insert into cv_documents (id, user_id, master_profile_id, job_title, job_description, tailored_content, created_at, updated_at)
  values (gen_random_uuid(), ${user.id}, ${mp.id}, 'Senior Frontend Developer', 'React, TypeScript, 5 tahun', jsonb_build_object('personalInfo', jsonb_build_object('fullName','Budi CV','email','budi@cv.com','phone','0812','address','Jakarta'),'workHistory', jsonb_build_array(jsonb_build_object('position','Frontend Dev','company','PT ABC','startDate','2021','endDate','2024','description','membangun UI'))), now(), now()) returning id`;
console.log('USER_ID=' + user.id);
console.log('CV_ID=' + cv.id);
await sql.end();
