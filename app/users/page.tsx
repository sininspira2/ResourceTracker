import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ClientNavigation } from '../components/ClientNavigation'
import { UserTable } from '../components/UserTable'

export default async function UsersPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/')
  }

  if (!session.user.permissions?.hasUserManagementAccess) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <ClientNavigation title="User Management" showDashboardLink={true} />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">User Management</h1>
            <p className="text-gray-600 dark:text-gray-400">View and manage user data</p>
          </header>

          <UserTable />
        </div>
      </main>
    </div>
  )
}
