import { db } from '../lib/db'
import { sql } from 'drizzle-orm'
import * as dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// Load .env.local variables explicitly
dotenv.config({ path: '.env.local' })

const MIGRATIONS_DIR = path.join(process.cwd(), 'drizzle')
const INITIAL_MIGRATION_ID = 0
const CARRIAGE_RETURN = 0x0d // The \r byte

/**
 * Reads a file as a raw buffer and removes all carriage return bytes (\r).
 * This provides a platform-agnostic way to normalize line endings to LF
 * before hashing, by operating on the byte level.
 * @param filePath The path to the file.
 * @returns A Buffer with all \r characters removed.
 */
function getNormalizedFileBuffer(filePath: string): Buffer {
  const fileBuffer = fs.readFileSync(filePath)
  const normalizedBytes: number[] = []
  for (const byte of fileBuffer) {
    if (byte !== CARRIAGE_RETURN) {
      normalizedBytes.push(byte)
    }
  }
  return Buffer.from(normalizedBytes)
}

/**
 * This script is for a specific legacy use case: baselining a database that
 * already has the initial schema but is missing the __drizzle_migrations table.
 * It finds the first migration file, calculates its hash from the local file
 * content after normalizing line endings at the byte level, and logs that hash.
 * This ensures the hash in the DB matches what `drizzle-kit` will calculate
 * on the user's machine, regardless of platform.
 */
async function logInitialMigration() {
  console.log(`\n⏳ Baselining database for legacy users...`)

  try {
    // 1. Find the initial migration file
    const migrationFiles = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith('.sql'))
      .sort()

    if (migrationFiles.length === 0) {
      console.error('❌ No migration files found in the drizzle directory.')
      process.exit(1)
    }
    const initialMigrationFile = migrationFiles[0]
    console.log(`🔍 Found initial migration file: ${initialMigrationFile}`)

    // 2. Calculate its hash from the normalized file buffer
    const filePath = path.join(MIGRATIONS_DIR, initialMigrationFile)
    const normalizedBuffer = getNormalizedFileBuffer(filePath)
    const initialMigrationHash = crypto.createHash('sha256').update(normalizedBuffer).digest('hex')
    console.log(`✅ Calculated normalized hash: ${initialMigrationHash}`)

    // 3. Create migration log table if it doesn't exist
    await db.run(
      sql.raw(
        `CREATE TABLE IF NOT EXISTS __drizzle_migrations (
          id INTEGER PRIMARY KEY,
          hash TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );`
      )
    )
    console.log(`✅ Migration log table exists or was created.`)

    // 4. Log the dynamically calculated hash
    const timestamp = Math.floor(Date.now() / 1000)
    const result = await db.run(sql`
      INSERT INTO __drizzle_migrations (id, hash, created_at)
      SELECT ${INITIAL_MIGRATION_ID}, ${initialMigrationHash}, ${timestamp}
      WHERE NOT EXISTS (
          SELECT 1 FROM __drizzle_migrations WHERE hash = ${initialMigrationHash}
      );
    `)

    if (result.rowsAffected > 0) {
      console.log(`✅ Successfully logged initial migration hash.`)
    } else {
      console.log(`✅ Initial migration hash already logged. No action needed.`)
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