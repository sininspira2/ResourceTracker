import { db } from '../lib/db'
import { sql } from 'drizzle-orm'
import * as dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// Load .env.local variables explicitly
dotenv.config({ path: '.env.local' })

const MIGRATIONS_DIR = path.join(process.cwd(), 'drizzle')
const JOURNAL_FILE = path.join(process.cwd(), 'drizzle', 'meta', '_journal.json')

/**
 * This script is for a specific legacy use case: baselining a database that
 * already has the initial schema but is missing the __drizzle_migrations table.
 * It reads the Drizzle journal to get the correct timestamp, calculates the
 * hash, and inserts a record that is identical to one Drizzle Kit would create.
 */
async function logInitialMigration() {
  console.log(`\n⏳ Baselining database for legacy users...`)

  try {
    // 1. Read the Drizzle journal file to get the correct metadata
    if (!fs.existsSync(JOURNAL_FILE)) {
      console.error(`❌ Drizzle journal file not found at ${JOURNAL_FILE}`)
      process.exit(1)
    }
    const journal = JSON.parse(fs.readFileSync(JOURNAL_FILE, 'utf-8'))
    const initialMigrationEntry = journal.entries.find((e: any) => e.idx === 0)

    if (!initialMigrationEntry) {
      console.error('❌ Could not find the initial migration (idx: 0) in the journal file.')
      process.exit(1)
    }

    const initialMigrationTag = initialMigrationEntry.tag
    const initialMigrationTimestamp = initialMigrationEntry.when
    const initialMigrationFile = `${initialMigrationTag}.sql`
    console.log(`🔍 Found initial migration entry: ${initialMigrationTag}`)
    console.log(`✅ Using timestamp from journal: ${initialMigrationTimestamp}`)

    // 2. Calculate its hash from the file content
    const filePath = path.join(MIGRATIONS_DIR, initialMigrationFile)
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Migration file not found: ${filePath}`)
      process.exit(1)
    }
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const normalizedContent = fileContent.replace(/\r\n/g, '\n')
    const initialMigrationHash = crypto.createHash('sha256').update(normalizedContent).digest('hex')
    console.log(`✅ Calculated normalized hash: ${initialMigrationHash}`)

    // 3. Create migration log table with the correct schema
    await db.run(
      sql.raw(
        `CREATE TABLE IF NOT EXISTS __drizzle_migrations (
          id NUMERIC PRIMARY KEY,
          hash TEXT NOT NULL,
          created_at NUMERIC
        );`
      )
    )
    console.log(`✅ Migration log table exists or was created.`)

    // 4. Check if the entry already exists
    const existingEntries = await db.all<{ hash: string }>(
      sql`SELECT hash FROM __drizzle_migrations WHERE hash = ${initialMigrationHash}`
    )

    if (existingEntries.length > 0) {
      console.log(`✅ Initial migration hash already logged. No action needed.`)
    } else {
      // 5. If not, insert it using the timestamp from the journal
      await db.run(sql`
        INSERT INTO __drizzle_migrations (hash, created_at)
        VALUES (${initialMigrationHash}, ${initialMigrationTimestamp});
      `)
      console.log(`✅ Successfully logged initial migration hash.`)
    }

    console.log(
      `   Database is now correctly baselined. You can now run 'npm run db:migrate' for future updates.`
    )
  } catch (error) {
    console.error('❌ A fatal error occurred while logging the initial migration.', error)
    console.error('   Ensure your database credentials are correct and the database is reachable.')
    process.exit(1)
  }
  process.exit(0)
}

logInitialMigration()