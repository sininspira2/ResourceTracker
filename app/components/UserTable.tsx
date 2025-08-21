'use client'

import { useState, useEffect } from 'react'

interface User {
  username: string
  customNickname: string
  createdAt: string
  lastLogin: string
}

export function UserTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/users')
        if (response.ok) {
          const data = await response.json()
          setUsers(data)
        }
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Loading users...
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-xs rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Username
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Custom Nickname
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Last Login
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user) => (
              <tr key={user.username}>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {user.username}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {user.customNickname}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {new Date(user.createdAt).toLocaleString()}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {new Date(user.lastLogin).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
