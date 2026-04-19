/**
 * Data migration: rename the 'Blueprints' category to 'Gear Blueprints'.
 *
 * Run against the live Turso DB separately from Drizzle DDL migrations:
 *   tsx --env-file .env.local scripts/migrate-blueprints-category.ts
 */

import { db } from "../lib/db";
import { sql } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function migrateBlueprintsCategory() {
  console.log("Renaming category 'Blueprints' → 'Gear Blueprints'...");

  const result = await db.run(
    sql`UPDATE resources SET category = 'Gear Blueprints' WHERE category = 'Blueprints'`,
  );

  console.log(`✅ Done. Rows updated: ${result.rowsAffected}`);
  process.exit(0);
}

migrateBlueprintsCategory().catch((error) => {
  console.error(
    "❌ Migration failed:",
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});
