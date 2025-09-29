import { db } from '../lib/db'
import { sql } from 'drizzle-orm'
import * as dotenv from 'dotenv'

// Load .env.local variables explicitly
dotenv.config({ path: '.env.local' })

// --- Values from your journal.json ---
const HASH = '0000_little_blockbuster'
const TIMESTAMP = 1759160886625

async function logInitialMigration() {
  console.log(`\n⏳ Checking migration log for ${HASH}...`)

  try {
    // Use raw SQL to attempt an INSERT only if the HASH record doesn't already exist.
    // This is the most idempotent and resilient way to update Drizzle's internal table.
    // NOTE: This will still throw if the __drizzle_migrations table is missing.
    await db.run(sql.raw(`
      INSERT INTO __drizzle_migrations (hash, created_at)
      SELECT '${HASH}', ${TIMESTAMP}
      WHERE NOT EXISTS (
          SELECT 1 FROM __drizzle_migrations WHERE hash = '${HASH}'
      );
    `))
    
    console.log(`✅ Successfully logged initial migration to __drizzle_migrations.`)
    console.log(`   Future 'drizzle-kit migrate' commands will now skip schema creation.`)

  } catch (error) {
    // The explicit message clearly tells the user to run the prerequisite command.
    console.warn("⚠️ Could not log the entry. This likely means the migration log table ('__drizzle_migrations') has not been created yet. Please ensure 'npx drizzle-kit push' runs successfully first.")
  }
  process.exit(0)
}

logInitialMigration().catch(err => {
    console.error('❌ Script failed:', err)
    process.exit(1)
})
