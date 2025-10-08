import { getMigrationStatus } from '@/lib/migration-status'
import Link from 'next/link'

export async function MigrationBanner() {
  const { status } = await getMigrationStatus()

  if (status === 'up-to-date' || status === 'error') {
    return null
  }

  const messages = {
    'no-table': 'Your database is missing the migration table. Please check',
    'out-of-date': 'Your database schema is out of date. Please check',
  }

  const message = messages[status]

  return (
    <div className="w-full bg-yellow-400 p-2 text-center text-black">
      <span>
        {message}{' '}
        <Link
          href="https://github.com/sininspira2/ResourceTracker/blob/main/DB_MIGRATION.md"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-blue-800"
        >
          here
        </Link>{' '}
        for instructions
      </span>
    </div>
  )
}