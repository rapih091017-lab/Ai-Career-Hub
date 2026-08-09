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
const email = 'audit.flow@example.com';
const [user] = await sql`insert into users (id, name, email, status, created_at) values (gen_random_uuid(), 'Audit Flow', ${email}, 'active', now()) on conflict (email) do update set status='active' returning id`;
const [mp] = await sql`insert into master_profiles (id, user_id, personal_info, work_history, education, skills, created_at) values (gen_random_uuid(), ${user.id}, jsonb_build_object('fullName','Siti Rahma','email','siti@mail.com','phone','0813','address','Surabaya'), jsonb_build_array(jsonb_build_object('position','Backend Dev','company','PT XYZ','startDate','2020','endDate','2024','description','API & database')), jsonb_build_array(jsonb_build_object('degree','S1','field','Teknik Informatika','institution','ITS')), jsonb_build_array(jsonb_build_object('name','Node.js'), jsonb_build_object('name','PostgreSQL')), now()) returning id`;
const [cv] = await sql`insert into cv_documents (id, user_id, master_profile_id, job_title, job_description, tailored_content, created_at, updated_at) values (gen_random_uuid(), ${user.id}, ${mp.id}, 'Fullstack Engineer', 'Node.js, PostgreSQL, 4 tahun pengalaman backend', jsonb_build_object('personalInfo', jsonb_build_object('fullName','Siti Rahma','email','siti@mail.com','phone','0813','address','Surabaya'),'workHistory', jsonb_build_array(jsonb_build_object('position','Backend Dev','company','PT XYZ','startDate','2020','endDate','2024','description','API & database')),'education', jsonb_build_array(jsonb_build_object('degree','S1','field','Teknik Informatika','institution','ITS')),'skills', jsonb_build_array(jsonb_build_object('name','Node.js'), jsonb_build_object('name','PostgreSQL'))), now(), now()) returning id`;
console.log('USER_ID=' + user.id);
console.log('CV_ID=' + cv.id);
await sql.end();
