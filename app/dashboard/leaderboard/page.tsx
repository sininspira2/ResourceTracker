'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Pagination } from '@/app/components/Pagination'

interface LeaderboardEntry {
  userId: string
  totalPoints: number
  totalActions: number
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

const timeFilterOptions = [
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'all', label: 'All Time' }
]

export default function LeaderboardPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState('7d')
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  
  const pageSize = 20

  useEffect(() => {
    fetchLeaderboard()
  }, [timeFilter, currentPage])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/leaderboard?timeFilter=${timeFilter}&page=${currentPage}&pageSize=${pageSize}`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard')
      }
      
      const leaderboardData = await response.json()
      setData(leaderboardData)
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      setError('Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }

  const handleUserClick = (userId: string) => {
    router.push(`/dashboard/contributions/${userId}`)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleTimeFilterChange = (newTimeFilter: string) => {
    setTimeFilter(newTimeFilter)
    setCurrentPage(1) // Reset to first page when changing filters
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading leaderboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                🏆 Leaderboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Top contributors in the {process.env.NEXT_PUBLIC_ORG_NAME || 'community'}
              </p>
            </div>
            <button
              onClick={() => router.push('/resources')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              Back to Resources
            </button>
          </div>

          {/* Time Filter */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time Period:
            </label>
            <select
              value={timeFilter}
              onChange={(e) => handleTimeFilterChange(e.target.value)}
              className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              {timeFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={fetchLeaderboard}
              className="mt-2 text-sm text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100"
            >
              Try again
            </button>
          </div>
        )}

        {/* Leaderboard */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Rankings ({timeFilterOptions.find(opt => opt.value === timeFilter)?.label})
            </h2>
            {data && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Showing {data.total} contributors
              </p>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-300">Loading...</p>
            </div>
          ) : !data || data.leaderboard.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">No contributions found for this time period</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Try selecting a different time period or start contributing to appear on the leaderboard!
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.leaderboard.map((entry, index) => {
                  // Calculate global rank based on current page
                  const globalRank = (currentPage - 1) * pageSize + index + 1
                  
                  return (
                    <div 
                      key={entry.userId} 
                      className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                      onClick={() => handleUserClick(entry.userId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                            globalRank === 1 ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200' :
                            globalRank === 2 ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200' :
                            globalRank === 3 ? 'bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200' :
                            'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300'
                          }`}>
                            #{globalRank}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">
                              {entry.userId}
                            </h3>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                              <span>{entry.totalActions} actions</span>
                              <span>•</span>
                              <span>{(entry.totalPoints / entry.totalActions).toFixed(1)} pts/action</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {entry.totalPoints.toFixed(1)} pts
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            Click to view details
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {data && (
                <Pagination
                  currentPage={data.page}
                  totalPages={data.totalPages}
                  onPageChange={handlePageChange}
                  hasNextPage={data.hasNextPage}
                  hasPrevPage={data.hasPrevPage}
                  totalItems={data.total}
                  itemsPerPage={data.pageSize}
                  isLoading={loading}
                />
              )}
            </>
          )}
        </div>

        {/* Points System Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
            📊 How Points Work
          </h3>
          <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
            <p><strong>ADD Actions:</strong> 0.1 points per resource (100 points per 1000 resources)</p>
            <p><strong>SET Actions:</strong> Fixed 1 points regardless of quantity</p>
            <p><strong>Refined Actions:</strong> Fixed 2 points for any action (special category)</p>
            <p><strong>Multipliers:</strong> Resources have different point multipliers (0.1x to 5x+)</p>
            <p><strong>Status Bonuses:</strong> Critical resources +10%, Below Target +5%</p>
            <p><strong>Categories:</strong> Raw, Components, and Refined categories earn points</p>
          </div>
        </div>
      </div>
    </div>
  )
} 