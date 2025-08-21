import { getServerSession } from 'next-auth'
import { authOptions, getDisplayName } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { RefreshRolesButton } from '../components/RefreshRolesButton'
import { ClientNavigation } from '../components/ClientNavigation'
import { NicknameSettings } from '../components/NicknameSettings'

export default async function Dashboard() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/')
  }

  // Check if user has any required roles for site access
  if (!session.user.permissions?.hasResourceAccess) {
    redirect('/')
  }

  const displayName = getDisplayName(session.user)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <ClientNavigation title={process.env.NEXT_PUBLIC_ORG_NAME || 'Resource Tracker'} showDashboardLink={false} />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              Welcome back, {displayName}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your profile and view your permissions</p>
          </header>

          {/* Resource Management - Prominent Section */}
          {session.user.permissions?.hasResourceAccess && (
            <div className="mb-8">
              <div className="bg-linear-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Resource Management</h2>
                    <p className="text-blue-100 mb-4">
                      Track, update, and monitor all your resources in real-time
                    </p>
                    <Link
                      href="/resources"
                      className="bg-white text-blue-700 hover:bg-blue-50 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 inline-flex"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12,10,3,6l9-4,9,4Zm-1,2L3,8V18l8,4Zm10,6V8l-8,4V22Z"/>
                      </svg>
                      Manage Resources
                    </Link>
                  </div>
                  <div className="hidden md:block">
                    <svg className="w-20 h-20 text-blue-200" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12,10,3,6l9-4,9,4Zm-1,2L3,8V18l8,4Zm10,6V8l-8,4V22Z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Management - Prominent Section */}
          {session.user.permissions?.hasUserManagementAccess && (
            <div className="mb-8">
              <div className="bg-linear-to-r from-red-600 to-red-700 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">User Management</h2>
                    <p className="text-red-100 mb-4">
                      View and manage user data
                    </p>
                    <Link
                      href="/users"
                      className="bg-white text-red-700 hover:bg-red-50 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 inline-flex"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                        <path d="M16 3.13a4 4 0 010 7.75"/>
                      </svg>
                      Manage Users
                    </Link>
                  </div>
                  <div className="hidden md:block">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 text-red-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                        <path d="M16 3.13a4 4 0 010 7.75"/>
                      </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* User Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Profile</h2>
              <div className="space-y-3">
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt="Profile"
                    className="w-16 h-16 rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{displayName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{session.user.email}</p>
                  {session.user.discordNickname && (
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Discord: {session.user.discordNickname}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Community Status Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Community Status</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                    session.user.isInGuild ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {session.user.isInGuild ? 'Community Member' : 'Not in Community'}
                  </span>
                </div>
                {session.user.roles && session.user.roles.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Roles:</span>
                    <span className="text-sm text-blue-600 dark:text-blue-400 ml-1">{session.user.roles.length} role(s)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Roles Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Your Roles</h2>
                <RefreshRolesButton />
              </div>
              <div className="space-y-2">
                {session.user.roles && session.user.roles.length > 0 ? (
                  session.user.roles.map((roleId: string) => (
                    <div key={roleId} className="flex items-center justify-between">
                      <span className="text-sm text-gray-900 dark:text-gray-100">Role ID: {roleId}</span>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-sm">
                        Discord Role
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">No roles found</p>
                )}
              </div>
            </div>
          </div>

          {/* Nickname Settings - Simplified */}
          <div className="mt-8">
            <NicknameSettings />
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/dashboard/activity"
                  className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                    </svg>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">Activity Log</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">View your activity history</p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/dashboard/privacy"
                  className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">Privacy & Data</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Manage your data and privacy</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 