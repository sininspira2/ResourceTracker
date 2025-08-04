'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
// Note: hasResourceAccess now computed server-side and available in session.user.permissions
import { getDisplayName } from '@/lib/auth'

export default function PrivacyPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [downloading, setDownloading] = useState(false)
  const [requestingDeletion, setRequestingDeletion] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    // 🐛 TEMPORARY DEBUG - Remove after fixing
    console.log('🔍 Privacy Page Debug (Fixed):', {
      status,
      session: !!session,
      userRoles: session?.user?.roles || [],
      permissions: session?.user?.permissions,
      hasResourceAccess: session?.user?.permissions?.hasResourceAccess ?? false
    })

    if (status === 'unauthenticated') {
      console.log('🚨 Privacy: Redirecting - unauthenticated')
      router.push('/')
      return
    }

    if (status === 'loading') {
      return
    }

    if (status === 'authenticated' && (!session || !session.user?.permissions?.hasResourceAccess)) {
      console.log('🚨 Privacy: Redirecting - no resource access', {
        hasSession: !!session,
        roles: session?.user?.roles || [],
        permissions: session?.user?.permissions,
        hasResourceAccess: session?.user?.permissions?.hasResourceAccess ?? false
      })
      router.push('/')
      return
    }
  }, [session, status, router])

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const downloadData = async () => {
    setDownloading(true)
    setMessage(null)
    try {
      const response = await fetch('/api/user/data-export', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        // Use the filename from the response headers
        const contentDisposition = response.headers.get('Content-Disposition')
        const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
        const filename = filenameMatch ? filenameMatch[1] : `silver-portal-data-${new Date().toISOString().split('T')[0]}.json`
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setMessage({ type: 'success', text: 'Your data has been downloaded successfully!' })
      } else {
        const errorData = await response.json().catch(() => ({}))
        setMessage({ type: 'error', text: errorData.error || 'Failed to download data. Please try again.' })
      }
    } catch (error) {
      console.error('Error downloading data:', error)
      setMessage({ type: 'error', text: 'An error occurred while downloading your data.' })
    } finally {
      setDownloading(false)
    }
  }

  const requestDataDeletion = async () => {
    if (!confirm('Are you sure you want to request deletion of your data? This action will anonymize all your resource change history and cannot be undone.')) {
      return
    }

    setRequestingDeletion(true)
    setMessage(null)
    try {
      const response = await fetch('/api/user/data-deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        }
      })

      if (response.ok) {
        const result = await response.json()
        setMessage({ 
          type: 'success', 
          text: `Data deletion request processed successfully. ${result.recordsAffected} records were anonymized.` 
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        setMessage({ type: 'error', text: errorData.error || 'Failed to submit deletion request. Please try again.' })
      }
    } catch (error) {
      console.error('Error requesting data deletion:', error)
      setMessage({ type: 'error', text: 'An error occurred while submitting your deletion request.' })
    } finally {
      setRequestingDeletion(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  const displayName = session ? getDisplayName(session.user) : 'User'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Privacy & Data</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          
          {/* Welcome */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Privacy & Data Management</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Welcome, {displayName}. Manage your personal data and privacy settings.
            </p>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-200'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200'
            }`}>
              {message.text}
            </div>
          )}
          
          {/* Data Rights Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Your Data Rights</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Under GDPR and other privacy regulations, you have certain rights regarding your personal data. 
              {process.env.NEXT_PUBLIC_ORG_NAME || 'Resource Tracker'} is committed to protecting your privacy and giving you control over your information.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">🔍 Right to Access</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Download all data we have about you, including your resource change history, Discord information, and account settings.
                </p>
                <button
                  onClick={downloadData}
                  disabled={downloading}
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {downloading ? 'Preparing Download...' : 'Download My Data'}
                </button>
              </div>

              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">🗑️ Right to Erasure</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Request anonymization of your personal data. This will remove your resource change history but preserve anonymized statistics.
                </p>
                <button
                  onClick={requestDataDeletion}
                  disabled={requestingDeletion}
                  className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {requestingDeletion ? 'Processing...' : 'Request Data Deletion'}
                </button>
              </div>
            </div>
          </div>

          {/* Data We Collect */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Data We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Discord Authentication Data</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your Discord username, server nickname, profile picture, and server roles (managed by Discord's privacy policy).
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Resource Activity</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Records of resource quantity changes you make, including timestamps, change amounts, and your display name at the time of change.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Session Data</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Temporary session tokens for authentication (automatically expire after 4 hours for enhanced security).
                </p>
              </div>
            </div>
          </div>

          {/* Data Retention */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Data Retention</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Resource Activity History</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Retained indefinitely to maintain resource management integrity, unless you request deletion.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Session Tokens</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Automatically deleted after 4 hours of inactivity.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Discord Profile Information</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Refreshed on each login from Discord's servers. Not permanently stored.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Need Help?</h2>
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              If you have questions about your data or need assistance with privacy-related requests, 
              please contact the server administrators through Discord.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 