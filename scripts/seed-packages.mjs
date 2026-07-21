// Script untuk buat tabel packages + seed data awal
// Jalankan: node scripts/seed-packages.mjs

import postgres from "postgres";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read .env file
const envPath = resolve(__dirname, "..", ".env");
const envContent = readFileSync(envPath, "utf-8");
const envVars = {};
envContent.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;
  const eqIndex = trimmed.indexOf("=");
  if (eqIndex > 0) {
    envVars[trimmed.slice(0, eqIndex).trim()] = trimmed.slice(eqIndex + 1).trim();
  }
});

const DATABASE_URL = envVars.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not found in .env");
  process.exit(1);
}

console.log("Connecting to database...");
const sql = postgres(DATABASE_URL, { ssl: "require" });

async function main() {
  try {
    // Create packages table
    console.log("Creating packages table...");
    await sql`
      CREATE TABLE IF NOT EXISTS packages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        key varchar(50) NOT NULL UNIQUE,
        name varchar(255) NOT NULL,
        price integer NOT NULL,
        period_days integer NOT NULL,
        monthly boolean DEFAULT false,
        limits jsonb,
        badge varchar(50),
        description text,
        active boolean DEFAULT true NOT NULL,
        sort_order integer DEFAULT 0,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      )
    `;
    console.log("✅ Packages table created successfully!");

    // Check if already seeded
    const existing = await sql`SELECT key FROM packages`;
    const existingKeys = new Set(existing.map(r => r.key));
    console.log(`Found ${existing.length} existing packages`);

    // Define initial packages (mirror of src/lib/access.ts PACKAGES)
    const INITIAL_PACKAGES = [
      {
        key: "cv_starter", name: "CV Starter", price: 7000, periodDays: 7, monthly: false, badge: "Basic",
        limits: { ai_cv_generate: false, cv_analyzer: false, ai_revision: false, ai_suggestion: false, portfolio_web: false, pdf_export: 1, bulk_analyzer: false, white_label: false }
      },
      {
        key: "cv_ai_generate", name: "CV + AI Generate", price: 12000, periodDays: 30, monthly: false, badge: "Populer",
        limits: { ai_cv_generate: "unlimited", cv_analyzer: false, ai_revision: "unlimited", ai_suggestion: "unlimited", portfolio_web: false, pdf_export: "unlimited", bulk_analyzer: false, white_label: false }
      },
      {
        key: "cv_analyzer", name: "CV Analyzer", price: 9000, periodDays: 30, monthly: false, badge: null,
        limits: { ai_cv_generate: false, cv_analyzer: 1, ai_revision: false, ai_suggestion: false, portfolio_web: false, pdf_export: false, bulk_analyzer: false, white_label: false }
      },
      {
        key: "portfolio_web", name: "Portfolio Web", price: 35000, periodDays: 30, monthly: false, badge: null,
        limits: { ai_cv_generate: false, cv_analyzer: false, ai_revision: false, ai_suggestion: false, portfolio_web: 1, pdf_export: false, bulk_analyzer: false, white_label: false }
      },
      {
        key: "bundle_hemat", name: "Bundle Hemat", price: 49000, periodDays: 60, monthly: false, badge: "Hemat 30%",
        limits: { ai_cv_generate: "unlimited", cv_analyzer: 1, ai_revision: "unlimited", ai_suggestion: "unlimited", portfolio_web: 1, pdf_export: "unlimited", bulk_analyzer: false, white_label: false }
      },
      {
        key: "single_cv", name: "Single CV AI Revision", price: 25000, periodDays: 365, monthly: false, badge: null,
        limits: { ai_cv_generate: false, cv_analyzer: false, ai_revision: "unlimited", ai_suggestion: "unlimited", portfolio_web: false, pdf_export: false, bulk_analyzer: false, white_label: false }
      },
      {
        key: "premium_pass_30d", name: "Premium Pass 30 Hari", price: 119000, periodDays: 30, monthly: true, badge: "Premium",
        limits: { ai_cv_generate: "unlimited", cv_analyzer: "unlimited", ai_revision: "unlimited", ai_suggestion: "unlimited", portfolio_web: "unlimited", pdf_export: "unlimited", bulk_analyzer: false, white_label: false }
      },
      {
        key: "starter_monthly", name: "Starter", price: 15000, periodDays: 30, monthly: true, badge: null,
        limits: { ai_cv_generate: 5, cv_analyzer: false, ai_revision: false, ai_suggestion: false, portfolio_web: false, pdf_export: "unlimited", bulk_analyzer: false, white_label: false }
      },
      {
        key: "pro_monthly", name: "Pro", price: 29000, periodDays: 30, monthly: true, badge: "Terlaris",
        limits: { ai_cv_generate: "unlimited", cv_analyzer: "unlimited", ai_revision: "unlimited", ai_suggestion: "unlimited", portfolio_web: 1, pdf_export: "unlimited", bulk_analyzer: false, white_label: false }
      },
      {
        key: "business_monthly", name: "Business", price: 79000, periodDays: 30, monthly: true, badge: null,
        limits: { ai_cv_generate: 20, cv_analyzer: "unlimited", ai_revision: "unlimited", ai_suggestion: "unlimited", portfolio_web: 3, pdf_export: "unlimited", bulk_analyzer: "unlimited", white_label: "unlimited" }
      },
    ];

    let seeded = 0;
    let skipped = 0;

    for (const pkg of INITIAL_PACKAGES) {
      if (existingKeys.has(pkg.key)) {
        skipped++;
        continue;
      }

      await sql`
        INSERT INTO packages (key, name, price, period_days, monthly, limits, badge, sort_order, active)
        VALUES (${pkg.key}, ${pkg.name}, ${pkg.price}, ${pkg.periodDays}, ${pkg.monthly}, ${JSON.stringify(pkg.limits)}, ${pkg.badge}, ${INITIAL_PACKAGES.indexOf(pkg)}, true)
      `;
      seeded++;
    }

    console.log(`✅ Seeded ${seeded} packages. Skipped ${skipped} (already exist).`);
    console.log("");
    console.log("Admin panel siap digunakan! Buka http://localhost:3000/admin");
  } catch (error) {
    console.error("Error:", error.message);
    console.error(error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

main();
