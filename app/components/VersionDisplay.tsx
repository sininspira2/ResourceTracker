'use client'

import { getCurrentVersion } from '@/lib/version'

interface VersionDisplayProps {
  onClick?: () => void
}

export function VersionDisplay({ onClick }: VersionDisplayProps) {
  const version = getCurrentVersion()
  
  return (
    <button
      onClick={onClick}
      className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer px-2 py-1 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-700"
      title="Click to view changelog"
      data-testid="version-display"
    >
      v{version}
    </button>
  )
} 