import { unstable_noStore as noStore } from 'next/cache'
import { db } from './db'
import { sql } from 'drizzle-orm'
import { LATEST_MIGRATION_TAG } from './constants'

type MigrationStatus = 'up-to-date' | 'out-of-date' | 'no-table' | 'error'

interface MigrationStatusResult {
  status: MigrationStatus
  latestMigrationTag?: string | null
}

// Helper function to check if a table exists
async function tableExists(tableName: string): Promise<boolean> {
  try {
    // This is a more universal way to check for table existence in SQLite
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
    const latestMigrationResult = await db.get<{ hash: string; created_at: number }>(
      sql`SELECT hash, created_at FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 1`
    )
    const dbHash = latestMigrationResult?.hash ?? null

    // Compare the database hash with the constant
    if (dbHash === LATEST_MIGRATION_TAG) {
      return { status: 'up-to-date' }
    } else {
      return { status: 'out-of-date', latestMigrationTag: LATEST_MIGRATION_TAG }
    }
  } catch (error) {
    console.error('Error checking migration status:', error)
    return { status: 'error' }
  }
}