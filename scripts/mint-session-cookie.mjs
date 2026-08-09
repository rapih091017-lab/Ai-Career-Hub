import { encode } from 'next-auth/jwt';
import { readFileSync } from 'fs';
const envText = readFileSync('.env.local', 'utf8');
const secret = envText.match(/^AUTH_SECRET=(.*)$/m)?.[1].trim();
const userId = process.argv[2] || '3977e81a-a301-42e3-b26c-14908c09ecdc';
const email = process.argv[3] || 'test.surat@example.com';
const token = await encode({
  token: { sub: userId, id: userId, name: 'User Test Surat', email },
  secret,
  maxAge: 60 * 60 * 24 * 7,
  salt: 'authjs.session-token',
});
console.log(token);
