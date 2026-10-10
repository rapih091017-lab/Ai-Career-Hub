import postgres from "postgres";
import { readFileSync } from "node:fs";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });
try {
  await sql.unsafe(readFileSync("drizzle/0019_career_hub_posts.sql", "utf8"));
  console.log("OK: drizzle/0019_career_hub_posts.sql");
} finally {
  await sql.end();
}
