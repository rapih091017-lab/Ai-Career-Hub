#!/usr/bin/env node
/**
 * Grant free premium access to a user.
 * Usage: node scripts/grant-premium.mjs <email> [days]
 * Example: node scripts/grant-premium.mjs rapih091017@gmail.com 365
 *
 * This inserts a successful payment record so getUserAccess() detects it.
 * Default: 365 days (1 year) of Pro access.
 */

import postgres from "postgres";
import { randomUUID } from "crypto";

const email = process.argv[2];
const days = parseInt(process.argv[3] || "365", 10);

if (!email) {
  console.error("Usage: node scripts/grant-premium.mjs <email> [days]");
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL env variable not set!");
  console.error("Run with: DATABASE_URL=postgresql://... node scripts/grant-premium.mjs ...");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { ssl: "require" });

try {
  // 1. Find user by email
  const [user] = await sql`
    SELECT id, name, email FROM users WHERE email = ${email} LIMIT 1
  `;

  if (!user) {
    console.error(`❌ User with email "${email}" not found in database.`);
    console.error("   Make sure the user has already signed up / registered.");
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.name} (${user.email}) — ID: ${user.id}`);

  // 2. Check if already has active premium
  const existingActive = await sql`
    SELECT id, package_type, expires_at FROM payments 
    WHERE user_id = ${user.id} 
      AND payment_status = 'success' 
      AND expires_at > NOW()
    ORDER BY expires_at DESC LIMIT 1
  `;

  if (existingActive.length > 0) {
    console.log(`⚠️  User already has active premium:`);
    console.log(`   Package: ${existingActive[0].package_type}`);
    console.log(`   Expires: ${existingActive[0].expires_at}`);
    const extend = process.argv.includes("--extend");
    if (!extend) {
      console.log("   To extend anyway, re-run with --extend flag");
      process.exit(0);
    }
  }

  // 3. Generate unique order ID
  const orderId = `GRANT-${randomUUID().slice(0, 8).toUpperCase()}`;

  // 4. Calculate expiry
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);

  // 5. Insert premium payment record
  const [payment] = await sql`
    INSERT INTO payments (
      id, user_id, order_id, package_type, amount,
      payment_status, payment_method, paid_at, expires_at
    ) VALUES (
      ${randomUUID()}, ${user.id}, ${orderId}, 'pro_monthly', 0,
      'success', 'granted', NOW(), ${expiresAt}
    )
    RETURNING id, order_id, expires_at
  `;

  console.log(`\n🎉 Premium access GRANTED!`);
  console.log(`   Order ID : ${payment.order_id}`);
  console.log(`   Package  : pro_monthly`);
  console.log(`   Expires  : ${payment.expires_at}`);
  console.log(`   Duration : ${days} hari`);
  console.log(`\n✅ User ${email} sekarang punya akses premium.`);

} catch (err) {
  console.error("❌ Error:", err.message);
  process.exit(1);
} finally {
  await sql.end();
}
