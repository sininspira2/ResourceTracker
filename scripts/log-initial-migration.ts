import { db } from '../lib/db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { MIGRATION_HASHES } from '../lib/migration-hashes';

const JOURNAL_FILE = path.join(process.cwd(), 'drizzle', 'meta', '_journal.json');

interface JournalEntry {
  idx: number;
  when: number;
  tag: string;
}

interface Journal {
  entries: JournalEntry[];
}

async function logInitialMigration() {
  console.log(`\n⏳ Attempting to log the initial database migration...`);

  if (!fs.existsSync(JOURNAL_FILE)) {
    console.error(`❌ Migration journal file not found at: ${JOURNAL_FILE}`);
    process.exit(1);
  }

  if (MIGRATION_HASHES.length === 0) {
    console.log('✅ No migration hashes found in the hash file. Nothing to log.');
    process.exit(0);
  }

  const initialHash = MIGRATION_HASHES[0];

  try {
    await db.run(sql.raw(`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id INTEGER PRIMARY KEY,
        hash TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL
      );
    `));
    console.log(`✅ Migration log table exists or was created.`);

    const journalContent = fs.readFileSync(JOURNAL_FILE, 'utf-8');
    const journal: Journal = JSON.parse(journalContent);
    const initialJournalEntry = journal.entries.find(e => e.idx === 0);

    if (!initialJournalEntry) {
      console.error('❌ Could not find the initial migration (idx: 0) in the journal file.');
      process.exit(1);
    }

    const createdAt = initialJournalEntry.when;

    const insertResult = await db.run(sql.raw(`
      INSERT INTO __drizzle_migrations (id, hash, created_at)
      SELECT 0, '${initialHash}', ${createdAt}
      WHERE NOT EXISTS (
          SELECT 1 FROM __drizzle_migrations WHERE id = 0
      );
    `));

    if (insertResult.rowsAffected && insertResult.rowsAffected > 0) {
      console.log(`✅ Successfully logged initial migration with hash ${initialHash.substring(0, 12)}...`);
    } else {
      console.log(`✅ Initial migration was already logged. Skipping.`);
    }
    
    console.log(`\n✅ Database is now baselined. You can now run 'npm run db:migrate' to apply new migrations.`);

  } catch (error) {
    console.error("❌ A fatal error occurred while logging the initial migration.");
    console.error(error);
    process.exit(1);
  }
  process.exit(0);
}

logInitialMigration();