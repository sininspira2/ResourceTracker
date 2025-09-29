import { db } from '../lib/db'
import { sql } from 'drizzle-orm'
import * as dotenv from 'dotenv'

// Load .env.local variables explicitly
dotenv.config({ path: '.env.local' })

// --- Values from your journal.json ---
// The local journal uses idx: 0 for the first migration.
const IDX = 0 
const HASH = '0000_little_blockbuster'
const TIMESTAMP = 1759160886625

async function logInitialMigration() {
  console.log(`\n⏳ Ensuring migration log table exists and logging initial migration (${HASH})...`)

  try {
    // 1. CREATE MIGRATION LOG TABLE (IF NOT EXISTS)
    // We explicitly use INTEGER PRIMARY KEY which is necessary for SQLite's sequencing.
    await db.run(sql.raw(`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id INTEGER PRIMARY KEY,
        hash TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `))
    console.log(`✅ Migration log table exists or was created.`)


    // 2. LOG INITIAL MIGRATION ENTRY (IF NOT EXISTS)
    // We explicitly set the ID to IDX (0) to match the local journal index.
    const insertResult = await db.run(sql.raw(`
      INSERT INTO __drizzle_migrations (id, hash, created_at)
      SELECT ${IDX}, '${HASH}', ${TIMESTAMP}
      WHERE NOT EXISTS (
          SELECT 1 FROM __drizzle_migrations WHERE hash = '${HASH}'
      );
    `))
    
    // Check if any rows were inserted (SQLite affectedRows check)
    if (insertResult.rowsAffected && insertResult.rowsAffected > 0) {
      console.log(`✅ Successfully logged initial migration to __drizzle_migrations with ID ${IDX}.`)
    } else {
      console.log(`✅ Migration entry for ${HASH} already existed. Skipping insertion.`)
    }
    
    console.log(`   Future 'drizzle-kit migrate' commands will now run correctly.`)

  } catch (error) {
    console.error("❌ A fatal database error occurred while logging the initial migration.")
    console.error("   Ensure your database credentials are correct and the database is reachable.")
    process.exit(1)
  }
  process.exit(0)
}

logInitialMigration()
