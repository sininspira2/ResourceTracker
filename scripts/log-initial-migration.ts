import { db } from '../lib/db'
import { sql } from 'drizzle-orm'
import * as dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// Load .env.local variables explicitly
dotenv.config({ path: '.env.local' })

const MIGRATIONS_DIR = path.join(process.cwd(), 'drizzle')

/**
 * This script is for a specific legacy use case: baselining a database that
 * already has the initial schema but is missing the __drizzle_migrations table.
 * It finds the first migration file, calculates its hash, and logs it to the
 * database using the exact schema and insertion method that Drizzle Kit uses.
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

    // 2. Calculate its hash from the file content, normalizing line endings
    const filePath = path.join(MIGRATIONS_DIR, initialMigrationFile)
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const normalizedContent = fileContent.replace(/\r\n/g, '\n')
    const initialMigrationHash = crypto.createHash('sha256').update(normalizedContent).digest('hex')
    console.log(`✅ Calculated normalized hash: ${initialMigrationHash}`)

    // 3. Create migration log table with the correct schema used by Drizzle
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

    // 4. Log the dynamically calculated hash, letting the DB handle the ID
    const timestamp = Date.now()
    const result = await db.run(sql`
      INSERT INTO __drizzle_migrations (hash, created_at)
      SELECT ${initialMigrationHash}, ${timestamp}
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