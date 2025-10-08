import { db } from '../lib/db'
import { sql } from 'drizzle-orm'
import * as dotenv from 'dotenv'

// Load .env.local variables explicitly
dotenv.config({ path: '.env.local' })

// This script is for a specific legacy use case: baselining a database that
// already has the initial schema but is missing the __drizzle_migrations table.
// It ensures that only the very first migration is logged, allowing
// `npm run db:migrate` to correctly handle all subsequent migrations.

const INITIAL_MIGRATION_ID = 0
const INITIAL_MIGRATION_HASH = 'bb874395de89233f5cd7f3099d16e6cd31c6de29b317cbfe72c585f3095627e7'
const TIMESTAMP = Math.floor(Date.now() / 1000)

async function logInitialMigration() {
  console.log(`\n⏳ Baselining database for legacy users...`)

  try {
    // 1. CREATE MIGRATION LOG TABLE (IF NOT EXISTS)
    await db.run(sql.raw`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id INTEGER PRIMARY KEY,
        hash TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `)
    console.log(`✅ Migration log table exists or was created.`)

    // 2. LOG INITIAL MIGRATION ENTRY (IF IT DOESN'T EXIST)
    // This ensures that if a user runs this script, `db:migrate` won't
    // try to re-apply the first migration.
    const result = await db.run(sql`
      INSERT INTO __drizzle_migrations (id, hash, created_at)
      SELECT ${INITIAL_MIGRATION_ID}, ${INITIAL_MIGRATION_HASH}, ${TIMESTAMP}
      WHERE NOT EXISTS (
          SELECT 1 FROM __drizzle_migrations WHERE hash = ${INITIAL_MIGRATION_HASH}
      );
    `)

    if (result.rowsAffected > 0) {
      console.log(`✅ Successfully logged initial migration hash: ${INITIAL_MIGRATION_HASH}`)
    } else {
      console.log(`✅ Initial migration hash already logged. No action needed.`)
    }

    console.log(`   Database is now correctly baselined. You can now run 'npm run db:migrate' for future updates.`)
  } catch (error) {
    console.error('❌ A fatal database error occurred while logging the initial migration.', error)
    console.error('   Ensure your database credentials are correct and the database is reachable.')
    process.exit(1)
  }
  process.exit(0)
}

logInitialMigration()