'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { 
  getCurrentVersion, 
  getReleasesSince, 
  shouldShowChangelog, 
  getChangeTypeIcon,
  getChangeTypeColor 
} from '@/lib/version'

const LAST_SEEN_VERSION_KEY = 'silverportal_last_seen_version'

interface WhatsNewModalProps {
  isOpen?: boolean
  onClose?: () => void
  forceShow?: boolean
}

export function WhatsNewModal({ isOpen: externalIsOpen, onClose: externalOnClose, forceShow = false }: WhatsNewModalProps) {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [releases, setReleases] = useState<any[]>([])

  useEffect(() => {
    if (!session) return

    // If externally controlled, use external state
    if (externalIsOpen !== undefined) {
      setIsOpen(externalIsOpen)
      if (externalIsOpen) {
        // When manually opened, show all recent releases (last 3)
        const allReleases = getReleasesSince('0.0.0') // Use a very old version to get all
        setReleases(allReleases.slice(0, 3))
      }
      return
    }

    // Otherwise, use automatic detection
    if (forceShow) return // Skip automatic detection if force showing

    const currentVersion = getCurrentVersion()
    const lastSeenVersion = localStorage.getItem(LAST_SEEN_VERSION_KEY)
    
    if (shouldShowChangelog(lastSeenVersion)) {
      const newReleases = getReleasesSince(lastSeenVersion || '0.0.0')
      if (newReleases.length > 0) {
        setReleases(newReleases)
        setIsOpen(true)
      }
    }
  }, [session, externalIsOpen, forceShow])

  const handleClose = (markAsSeen: boolean = false) => {
    if (markAsSeen) {
      const currentVersion = getCurrentVersion()
      localStorage.setItem(LAST_SEEN_VERSION_KEY, currentVersion)
    }
    
    setIsOpen(false)
    if (externalOnClose) {
      externalOnClose()
    }
  }

  if (!isOpen || releases.length === 0) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">What's New</h2>
              <p className="text-blue-100 mt-1">Latest updates and improvements</p>
            </div>
            <button
              onClick={() => handleClose(false)}
              className="text-blue-100 hover:text-white p-1 rounded-full hover:bg-blue-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {releases.map((release) => (
            <div key={release.version} className="mb-8 last:mb-0">
              {/* Release Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {release.title}
                    </h3>
                    <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                      v{release.version}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Released {release.date}
                  </p>
                </div>
              </div>

              {/* Changes */}
              <div className="space-y-3">
                {release.changes.map((change: any, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className={`text-sm px-2 py-1 rounded-full ${getChangeTypeColor(change.type)}`}>
                      {getChangeTypeIcon(change.type)}
                    </span>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                      {change.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 rounded-b-lg flex gap-3 justify-end">
          {!forceShow && externalIsOpen === undefined && (
            <>
              <button
                onClick={() => handleClose(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
              >
                Remind Me Later
              </button>
              <button
                onClick={() => handleClose(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Got It!
              </button>
            </>
          )}
          {(forceShow || externalIsOpen !== undefined) && (
            <button
              onClick={() => handleClose(false)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
} 