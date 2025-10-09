import { unstable_noStore as noStore } from 'next/cache'
import { db } from './db'
import { sql } from 'drizzle-orm'
import { MIGRATION_HASHES } from './migration-hashes'

type MigrationStatus = 'up-to-date' | 'out-of-date' | 'no-table' | 'error'

interface MigrationStatusResult {
  status: MigrationStatus
  latestExpectedHash?: string | null
}

// Helper function to check if a table exists
async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await db.get(
      sql`SELECT name FROM sqlite_master WHERE type='table' AND name=${tableName}`
    )
    return !!result
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error)
    return false
  }
}

export async function getMigrationStatus(): Promise<MigrationStatusResult> {
  noStore()
  try {
    const migrationsTableExists = await tableExists('__drizzle_migrations')

    if (!migrationsTableExists) {
      return { status: 'no-table' }
    }

    // Get the latest migration hash from the database
    const latestMigrationResult = await db.get<{ hash: string }>(
      sql`SELECT hash FROM __drizzle_migrations ORDER BY id DESC, created_at DESC LIMIT 1`
    )
    const dbHash = latestMigrationResult?.hash ?? null

    // Get the latest hash from our generated file
    const latestExpectedHash =
      MIGRATION_HASHES.length > 0 ? MIGRATION_HASHES[MIGRATION_HASHES.length - 1] : null

    // If there are no expected hashes and no db hash, we are up to date.
    if (!latestExpectedHash && !dbHash) {
      return { status: 'up-to-date' }
    }

    // Compare the database hash with the latest hash from our file
    if (dbHash === latestExpectedHash) {
      return { status: 'up-to-date' }
    } else {
      return { status: 'out-of-date', latestExpectedHash: latestExpectedHash }
    }
  } catch (error) {
    console.error('Error checking migration status:', error)
    return { status: 'error' }
  }
}