import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LoginButton } from './components/LoginButton'
import { LogoutButton } from './components/LogoutButton'
import { hasResourceAccess } from '@/lib/discord-roles'

export default async function Home() {
  const session = await getServerSession(authOptions)

  // Redirect authenticated users with access directly to dashboard
  if (session && hasResourceAccess(session.user.roles)) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 dark:from-gray-900 dark:to-blue-900 text-white transition-colors duration-300">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">{process.env.NEXT_PUBLIC_APP_NAME || 'Resource Tracker'}</h1>
          <p className="text-xl text-blue-200 dark:text-blue-300">
            Resource management and tracking portal for {process.env.NEXT_PUBLIC_ORGANIZATION_NAME || 'your organization'}
          </p>
        </header>

        <div className="max-w-md mx-auto">
          {session ? (
            // User is logged in but doesn't have access
            <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-md rounded-lg p-8 text-center border border-white/20 dark:border-gray-700">
              <div className="mb-6">
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt="Profile"
                    className="w-16 h-16 rounded-full mx-auto mb-4"
                  />
                )}
                <h2 className="text-xl font-bold mb-2">
                  Welcome, {session.user.name}!
                </h2>
              </div>
              
              <div className="bg-red-500/20 dark:bg-red-900/50 border border-red-400 dark:border-red-600 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-6 h-6 text-red-400 dark:text-red-300 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.888-.833-2.664 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="font-medium text-red-200 dark:text-red-300">Access Denied</span>
                </div>
                <p className="text-red-200 dark:text-red-300 text-sm mb-3">
                  {session.user.isInGuild 
                    ? 'You need the required Discord roles to access this portal.' 
                    : 'You must be a member of the Discord server to access this portal.'
                  }
                </p>
                <div className="text-red-100 dark:text-red-200 text-xs bg-red-600/20 dark:bg-red-800/30 rounded px-3 py-2">
                  <div className="font-medium mb-1">Requirements:</div>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Be a member of the Discord server</li>
                    <li>Have appropriate resource management roles</li>
                    <li>Contact server administrators if you believe you should have access</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <LogoutButton variant="prominent" fullWidth={true} />
                <p className="text-center text-blue-200/80 dark:text-blue-300/80 text-sm">
                  Try logging in with a Discord account that has the required server roles
                </p>
              </div>
            </div>
          ) : (
            // User is not logged in
            <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-md rounded-lg p-8 text-center border border-white/20 dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
              <p className="text-blue-200 dark:text-blue-300 mb-8">
                Please sign in with Discord to access the resource portal.
              </p>
              <LoginButton />
            </div>
          )}
        </div>

        <footer className="text-center mt-16 text-blue-200/60 dark:text-blue-300/60">
          <p className="text-sm">
            Powered by Discord authentication • Secure role-based access
          </p>
        </footer>
      </div>
    </main>
  )
} 