import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";
import { validateEnv } from "@/lib/env";

// Validate env FIRST — fail fast before connecting to DB
const validated = validateEnv();

const client = postgres(validated.DATABASE_URL, { ssl: "require" });
export const db = drizzle(client, { schema });
