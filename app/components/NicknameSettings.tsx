'use client'

import { useSession } from 'next-auth/react'

export function NicknameSettings() {
  const { data: session } = useSession()

  if (!session) return null

  const displayName = session.user.discordNickname || session.user.name || 'Unknown User'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Display Name</h2>
      
      <div className="space-y-3">
        {/* Current Display Name */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              {session.user.discordNickname ? 'Discord Nickname' : 'Discord Username'}
            </span>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>&quot;{displayName}&quot;</strong>
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            {session.user.discordNickname 
              ? 'This is your Discord server nickname and is used throughout the app'
              : 'This is your Discord username. Server admins can set a server nickname for you.'
            }
          </p>
        </div>

        {/* Info */}
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            💡 Your display name is automatically synced from Discord. 
            {session.user.discordNickname 
              ? ' Server admins can update your nickname in Discord.'
              : ' Ask a server admin to set a server nickname for you in Discord if you\'d like a different display name.'
            }
          </p>
        </div>
      </div>
    </div>
  )
} 