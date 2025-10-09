import { db } from '../lib/db'
import { sql } from 'drizzle-orm'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function checkMigrations() {
  const shouldDrop = process.argv.includes('--drop')

  if (shouldDrop) {
    console.log('\n--- Dropping __drizzle_migrations table ---')
    try {
      await db.run(sql`DROP TABLE IF EXISTS __drizzle_migrations;`)
      console.log('✅ Table dropped successfully.')
    } catch (e) {
      console.error('❌ An error occurred while dropping the table:', e)
    }
    console.log('----------------------------------------\n')
    process.exit(0)
  }

  console.log('\n--- Checking __drizzle_migrations table ---')
  try {
    const migrations = await db.all(sql`SELECT * FROM __drizzle_migrations ORDER BY id;`)
    if (migrations.length === 0) {
      console.log('✅ Table is empty.')
    } else {
      console.table(migrations)
    }
  } catch (e: any) {
    if (e.message.includes('no such table')) {
      console.log('✅ Table does not exist.')
    } else {
      console.error('❌ An error occurred while querying the database:', e)
    }
  }
  console.log('----------------------------------------\n')
  process.exit(0)
}

checkMigrations()