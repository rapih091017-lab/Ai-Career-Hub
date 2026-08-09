import { SignJWT } from 'jose';
import { readFileSync } from 'fs';
const envText = readFileSync('.env.local', 'utf8');
const m = envText.match(/^AUTH_SECRET=(.*)$/m);
const secret = new TextEncoder().encode(m[1].trim());
const userId = process.argv[2] || '3977e81a-a301-42e3-b26c-14908c09ecdc';
const email = process.argv[3] || 'test.surat@example.com';
const token = await new SignJWT({ sub: userId, id: userId, name: 'User Test Surat', email })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('7d')
  .sign(secret);
console.log(token);
