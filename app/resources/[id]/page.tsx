'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ResourceHistoryChart } from '@/app/components/ResourceHistoryChart'
import { CongratulationsPopup } from '@/app/components/CongratulationsPopup'
import { hasResourceAccess, hasResourceAdminAccess } from '@/lib/discord-roles'
import { getUserIdentifier } from '@/lib/auth'

// Utility function to format numbers with commas
const formatNumber = (num: number): string => {
  return num.toLocaleString()
}

// Calculate status based on quantity vs target
const calculateResourceStatus = (quantity: number, targetQuantity: number | null): 'at_target' | 'below_target' | 'critical' => {
  if (!targetQuantity || targetQuantity <= 0) return 'at_target'

  const percentage = (quantity / targetQuantity) * 100
  if (percentage >= 100) return 'at_target'      // Green - at or above target
  if (percentage >= 50) return 'below_target'    // Orange - below target but not critical
  return 'critical'                              // Red - very much below target
}

// Format status for display
const formatStatusForDisplay = (status: string): string => {
  switch (status) {
    case 'at_target': return 'At Target'
    case 'below_target': return 'Below Target'
    case 'critical': return 'Critical'
    default: return status || 'Unknown'
  }
}

// Calculate relative time
const getRelativeTime = (date: string | Date, now = new Date()): string => {
  const then = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days === 1 ? '' : 's'} ago`
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000)
    return `${months} month${months === 1 ? '' : 's'} ago`
  } else {
    const years = Math.floor(diffInSeconds / 31536000)
    return `${years} year${years === 1 ? '' : 's'} ago`
  }
}

interface Resource {
  id: string
  name: string
  quantityHagga: number
  quantityDeepDesert: number
  description?: string
  category?: string
  icon?: string
  imageUrl?: string
  targetQuantity?: number
  multiplier?: number
  lastUpdatedBy: string
  createdAt: string
  updatedAt: string
}

export default function ResourceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const [resource, setResource] = useState<Resource | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeFilter, setTimeFilter] = useState(7) // days
  const [editMode, setEditMode] = useState(false)
  const [newQuantity, setNewQuantity] = useState<number>(0)
  const [newQuantityInput, setNewQuantityInput] = useState<string>('')
  const [updateType, setUpdateType] = useState<'absolute' | 'relative'>('absolute')
  const [saving, setSaving] = useState(false)
  const [hoveredPoint, setHoveredPoint] = useState<any>(null)
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Congratulations popup state
  const [congratulationsState, setCongratulationsState] = useState({
    isVisible: false,
    finalPoints: 0,
    pointsCalculation: {
      basePoints: 0,
      resourceMultiplier: 1.0,
      statusBonus: 0,
      finalPoints: 0
    },
    resourceName: '',
    actionType: 'ADD' as 'ADD' | 'SET' | 'REMOVE',
    quantityChanged: 0
  })

  const resourceId = params.id as string
  const userRoles = session?.user?.roles || []
  const canEdit = hasResourceAccess(userRoles)
  
  // Check if user can delete history entries
  const canDeleteHistory = hasResourceAdminAccess(userRoles)

  // Fetch history data
  const fetchHistory = async (days: number) => {
    setHistoryLoading(true)
    try {
      const response = await fetch(`/api/resources/${resourceId}/history?days=${days}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      })
      if (response.ok) {
        const historyData = await response.json()
        setHistory(historyData)
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setHistoryLoading(false)
    }
  }

  // Fetch leaderboard data
  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true)
    try {
      const response = await fetch('/api/leaderboard?timeFilter=7d&limit=10', {
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setLeaderboard(data.leaderboard || [])
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLeaderboardLoading(false)
    }
  }

  // Calculate leaderboard from history (legacy - keeping for fallback)
  const calculateLeaderboard = () => {
    const userStats: Record<string, { contributed: number, taken: number, netChange: number, changeCount: number }> = {}

    // Only count relative changes for the leaderboard, not absolute value updates
    history
      .filter(entry => entry.changeType === 'relative') // Only relative changes count toward contributions
      .forEach(entry => {
        const user = entry.updatedBy
        if (!userStats[user]) {
          userStats[user] = { contributed: 0, taken: 0, netChange: 0, changeCount: 0 }
        }

        const totalChange = entry.changeAmountHagga + entry.changeAmountDeepDesert;
        if (totalChange > 0) {
          userStats[user].contributed += totalChange
        } else if (totalChange < 0) {
          userStats[user].taken += Math.abs(totalChange)
        }

        userStats[user].netChange += totalChange
        userStats[user].changeCount += 1
      })

    return userStats
  }

  // Update resource quantity
  const updateResource = async () => {
    if (!resource || !canEdit) return

    setSaving(true)
    try {
      // Parse the final value from input to ensure we have the latest value
      const inputValue = newQuantityInput === '' || newQuantityInput === '-' ? 0 : (parseInt(newQuantityInput) || 0)

      const finalQuantity = updateType === 'relative'
        ? Math.max(0, resource.quantityHagga + inputValue)
        : Math.max(0, inputValue)

      const response = await fetch(`/api/resources/${resourceId}`, {
        method: 'PUT',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          quantity: finalQuantity,
          updateType: updateType,
          changeValue: inputValue,
          reason: updateType === 'relative' ? `${inputValue > 0 ? '+' : ''}${inputValue}` : undefined
        }),
      })

      if (response.ok) {
        const responseData = await response.json()
        
        // Handle new API response format with points
        const updatedResource = responseData.resource || responseData
        
        setResource({
          ...updatedResource,
          // Fix date parsing - only convert if it's not already a string
          updatedAt: typeof updatedResource.updatedAt === 'string' 
            ? updatedResource.updatedAt 
            : new Date(updatedResource.updatedAt).toISOString(),
        })
        
        // Show congratulations popup if points were earned
        if (responseData.pointsEarned && responseData.pointsEarned > 0) {
          setCongratulationsState({
            isVisible: true,
            finalPoints: responseData.pointsEarned,
            pointsCalculation: responseData.pointsCalculation || {
              basePoints: responseData.pointsEarned,
              resourceMultiplier: 1.0,
              statusBonus: 0,
              finalPoints: responseData.pointsEarned
            },
            resourceName: resource.name,
            actionType: updateType === 'relative' ? 'ADD' : 'SET',
            quantityChanged: Math.abs(inputValue)
          })
        }
        
        setEditMode(false)
        setNewQuantity(0)
        setNewQuantityInput('')
        // Refresh history and leaderboard to show the new change
        fetchHistory(timeFilter)
        fetchLeaderboard()
      } else {
        const errorData = await response.text()
        console.error('Failed to update resource:', errorData)
        setError('Failed to update resource')
      }
    } catch (error) {
      console.error('Error updating resource:', error)
      setError('Error updating resource: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  // Delete history entry
  const deleteHistoryEntry = async (entryId: string) => {
    if (!canDeleteHistory) return

    if (!confirm('Are you sure you want to delete this history entry? This action cannot be undone.')) {
      return
    }

    setSaving(true)
    try {
      // Find the entry being deleted
      const entryToDelete = history.find(h => h.id === entryId)
      if (!entryToDelete) return

      // Check if this is the most recent entry (first in history array since it's sorted by date desc)
      const isLatestEntry = history[0]?.id === entryId

      const response = await fetch(`/api/resources/${resourceId}/history/${entryId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        // If this was the most recent entry, we need to revert the resource quantity
        if (isLatestEntry && resource) {
          // Update the resource quantity to the previous quantity from the deleted entry
          const revertedQuantityHagga = entryToDelete.previousQuantityHagga

          // Update the resource in the backend
          await fetch(`/api/resources/${resourceId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              quantity: revertedQuantityHagga,
              updateType: 'absolute',
              value: revertedQuantityHagga,
              reason: `Reverted from deleted entry`
            }),
          })

          // Update local state
          setResource({
            ...resource,
            quantityHagga: revertedQuantityHagga,
            updatedAt: new Date().toISOString(),
          })
        }

        // Refresh history
        fetchHistory(timeFilter)
        // Refresh leaderboard after history deletion
        fetchLeaderboard()
      } else {
        console.error('Failed to delete history entry')
        alert('Failed to delete history entry. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting history entry:', error)
      alert('Error deleting history entry. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    // Redirect if user is not authenticated
    if (sessionStatus === 'unauthenticated') {
      router.push('/')
      return
    }

    // Don't proceed if session is still loading
    if (sessionStatus === 'loading') {
      return
    }

    // Check for resource access once session is loaded
    if (sessionStatus === 'authenticated' && (!session || !session.user?.permissions?.hasResourceAccess)) {
      router.push('/')
      return
    }

    const fetchResource = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/resources`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          }
        })

        if (response.ok) {
          const resources = await response.json()
          const foundResource = resources.find((r: Resource) => r.id === resourceId)

          if (foundResource) {
            setResource({
              ...foundResource,
              // Fix date parsing - only convert if it's not already a string
              updatedAt: typeof foundResource.updatedAt === 'string' 
                ? foundResource.updatedAt 
                : new Date(foundResource.updatedAt).toISOString(),
              createdAt: typeof foundResource.createdAt === 'string' 
                ? foundResource.createdAt 
                : new Date(foundResource.createdAt).toISOString(),
            })
            setNewQuantity(foundResource.quantityHagga) // Initialize edit form
            setNewQuantityInput(foundResource.quantityHagga.toString())
          } else {
            setError('Resource not found')
          }
        } else {
          setError('Failed to fetch resource')
        }
      } catch (error) {
        console.error('Error fetching resource:', error)
        setError('Error loading resource')
      } finally {
        setLoading(false)
      }
    }

    fetchResource()
  }, [resourceId, session, router, sessionStatus])

  // Fetch history when component mounts or time filter changes
  useEffect(() => {
    if (resourceId && sessionStatus === 'authenticated') {
      fetchHistory(timeFilter)
      fetchLeaderboard()
    }
  }, [resourceId, timeFilter, sessionStatus])

  // Scroll selected entry into view
  useEffect(() => {
    if (selectedPointId) {
      const element = document.getElementById(`history-entry-${selectedPointId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [selectedPointId])

  // Update current time every minute to keep relative times fresh
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  if (loading || sessionStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading resource details...</p>
        </div>
      </div>
    )
  }

  if (!resource) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Resource Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The resource you're looking for doesn't exist or you don't have permission to view it.
            {!canEdit && (
              <>
                <br />
                <span className="text-sm">Please make sure you have the required Discord roles.</span>
              </>
            )}
          </p>
          <button
            onClick={() => router.push('/resources')}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Resources
          </button>
        </div>
      </div>
    )
  }

  const status = calculateResourceStatus(resource.quantityHagga + resource.quantityDeepDesert, resource.targetQuantity || null)
  const percentage = resource.targetQuantity ? Math.round(((resource.quantityHagga + resource.quantityDeepDesert) / resource.targetQuantity) * 100) : null

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Raw': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'Refined': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'Components': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'Other': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'at_target': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'below_target': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.push('/resources')}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Resources
            </button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Resource Details</h1>
            <div></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">

          {/* Resource Info Card - Full Width Horizontal Layout */}
          <div className="w-full">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Resource Image */}
                <div className="flex-shrink-0">
                  {resource.imageUrl ? (
                    <img
                      src={resource.imageUrl}
                      alt={resource.name}
                      className="w-32 h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600 mx-auto md:mx-0"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const fallback = target.nextElementSibling as HTMLElement
                        if (fallback) fallback.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <div className={`w-32 h-32 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center mx-auto md:mx-0 ${resource.imageUrl ? 'hidden' : 'flex'}`}>
                    <span className="text-gray-400 dark:text-gray-500 text-sm">No Image</span>
                  </div>
                </div>

                {/* Resource Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="text-center md:text-left">
                      {/* Resource Name */}
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        {resource.name}
                      </h2>

                      {/* Category and Status */}
                      <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-2">
                        {resource.category && (
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getCategoryColor(resource.category)}`}>
                            {resource.category}
                          </span>
                        )}
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(status)}`}>
                          {formatStatusForDisplay(status)}
                        </span>
                      </div>

                      {/* Description */}
                      {resource.description && (
                        <p className="text-gray-600 dark:text-gray-400 text-center md:text-left">
                          {resource.description}
                        </p>
                      )}
                    </div>

                    {/* Quantities */}
                    <div className="flex flex-col sm:flex-row gap-6 text-center">
                      <div>
                        <div className="text-xl font-bold text-gray-900 dark:text-gray-100">Hagga: {formatNumber(resource.quantityHagga)}</div>
                        <div className="text-xl font-bold text-gray-900 dark:text-gray-100">Deep Desert: {formatNumber(resource.quantityDeepDesert)}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Current Quantities</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                          {resource.targetQuantity ? formatNumber(resource.targetQuantity) : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Target Quantity</div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {percentage && (
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>Progress to Target</span>
                        <span>{percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${percentage >= 100 ? 'bg-green-500' :
                              percentage >= 50 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Last Updated */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-center md:text-left text-sm text-gray-600 dark:text-gray-400">
                    <div>Last updated by: <span className="font-medium text-gray-900 dark:text-gray-100">{resource.lastUpdatedBy}</span></div>
                    <div
                      className="cursor-help hover:underline decoration-dotted"
                      title={new Date(resource.updatedAt).toLocaleString()}
                    >
                      {getRelativeTime(resource.updatedAt, currentTime)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Mode Modal/Overlay */}
          {editMode && canEdit && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Update Quantity</h3>
                  <button
                    onClick={() => setEditMode(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Update Type Toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const newType = updateType === 'absolute' ? 'relative' : 'absolute'
                        setUpdateType(newType)
                        if (newType === 'relative') {
                          setNewQuantity(0)
                          setNewQuantityInput('0')
                        } else {
                          setNewQuantity(resource.quantityHagga)
                          setNewQuantityInput(resource.quantityHagga.toString())
                        }
                      }}
                      className={`px-3 py-1 rounded text-sm font-medium ${updateType === 'relative'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                      {updateType === 'relative' ? '+/-' : '='}
                    </button>
                    <span className="text-sm text-gray-600">
                      {updateType === 'relative' ? 'Relative Change' : 'Absolute Value'}
                    </span>
                  </div>

                  {/* Quantity Input */}
                  <div>
                    <input
                      type="number"
                      value={newQuantityInput}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === '' || value === '-') {
                          setNewQuantityInput(value)
                          setNewQuantity(0)
                        } else {
                          const parsed = parseInt(value)
                          setNewQuantityInput(value)
                          setNewQuantity(isNaN(parsed) ? 0 : parsed)
                        }
                      }}
                      placeholder={updateType === 'relative' ? '±0' : 'New quantity'}
                      className="w-full px-3 py-2 border rounded-lg text-right"
                      min={updateType === 'absolute' ? '0' : undefined}
                    />
                    {updateType === 'relative' && (
                      <div className="text-xs text-gray-500 mt-1">
                        New quantity: {formatNumber(Math.max(0, resource.quantityHagga + newQuantity))}
                      </div>
                    )}
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={updateResource}
                    disabled={saving}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg font-medium"
                  >
                    {saving ? 'Updating...' : 'Update Quantity'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* History and Leaderboard Section - Full Width */}
        <div className="w-full space-y-8">
          {/* Activity Timeline with Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Activity Timeline</h3>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">Time Range:</span>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(parseInt(e.target.value))}
                  className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value={1}>Last 24 hours</option>
                  <option value={3}>Last 3 days</option>
                  <option value={7}>Last 7 days</option>
                  <option value={14}>Last 14 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 3 months</option>
                </select>
              </div>
            </div>

            {/* History Chart */}
            {!historyLoading && history.length > 1 && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">Quantity Over Time</h4>
                <div className="relative h-40">
                  <svg
                    className="w-full h-full"
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setMousePosition({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top
                      })
                    }}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    {/* Chart Lines */}
                    {history.slice().reverse().map((entry, index, arr) => {
                      if (index === arr.length - 1) return null
                      const nextEntry = arr[index + 1]

                      const x1 = 10 + (index / Math.max(arr.length - 1, 1)) * 80
                      const x2 = 10 + ((index + 1) / Math.max(arr.length - 1, 1)) * 80

                      const maxQuantity = Math.max(...history.map(h => Math.max(h.previousQuantityHagga + h.previousQuantityDeepDesert, h.newQuantityHagga + h.newQuantityDeepDesert)))
                      const minQuantity = Math.min(...history.map(h => Math.min(h.previousQuantityHagga + h.previousQuantityDeepDesert, h.newQuantityHagga + h.newQuantityDeepDesert)))
                      const range = maxQuantity - minQuantity || 1

                      const y1 = 80 - (((entry.newQuantityHagga + entry.newQuantityDeepDesert) - minQuantity) / range) * 60
                      const y2 = 80 - (((nextEntry.newQuantityHagga + nextEntry.newQuantityDeepDesert) - minQuantity) / range) * 60

                      return (
                        <line
                          key={entry.id}
                          x1={`${x1}%`}
                          y1={`${y1}%`}
                          x2={`${x2}%`}
                          y2={`${y2}%`}
                          stroke="#3b82f6"
                          strokeWidth="2"
                        />
                      )
                    })}

                    {/* Chart Points */}
                    {history.slice().reverse().map((entry, index, arr) => {
                      const x = 10 + (index / Math.max(arr.length - 1, 1)) * 80
                      const maxQuantity = Math.max(...history.map(h => Math.max(h.previousQuantityHagga + h.previousQuantityDeepDesert, h.newQuantityHagga + h.newQuantityDeepDesert)))
                      const minQuantity = Math.min(...history.map(h => Math.min(h.previousQuantityHagga + h.previousQuantityDeepDesert, h.newQuantityHagga + h.newQuantityDeepDesert)))
                      const range = maxQuantity - minQuantity || 1
                      const y = 80 - (((entry.newQuantityHagga + entry.newQuantityDeepDesert) - minQuantity) / range) * 60

                      const isSelected = selectedPointId === entry.id
                      const isHovered = hoveredPoint?.id === entry.id

                      return (
                        <g key={`point-${entry.id}`}>
                          <circle
                            cx={`${x}%`}
                            cy={`${y}%`}
                            r={isSelected ? "6" : isHovered ? "5" : "4"}
                            fill={entry.changeAmountHagga + entry.changeAmountDeepDesert > 0 ? '#10b981' : entry.changeAmountHagga + entry.changeAmountDeepDesert < 0 ? '#ef4444' : '#6b7280'}
                            stroke={isSelected ? '#3b82f6' : 'white'}
                            strokeWidth={isSelected ? "3" : "2"}
                            className="hover:cursor-pointer transition-all"
                            onMouseEnter={() => setHoveredPoint(entry)}
                            onMouseLeave={() => setHoveredPoint(null)}
                            onClick={() => setSelectedPointId(selectedPointId === entry.id ? null : entry.id)}
                          />
                        </g>
                      )
                    })}

                    {/* Y-axis labels */}
                    {history.length > 0 && (
                      <>
                        <text x="5" y="15" fontSize="10" fill="#6b7280" className="text-xs">
                          {formatNumber(Math.max(...history.map(h => Math.max(h.previousQuantityHagga + h.previousQuantityDeepDesert, h.newQuantityHagga + h.newQuantityDeepDesert))))}
                        </text>
                        <text x="5" y="85" fontSize="10" fill="#6b7280" className="text-xs">
                          {formatNumber(Math.min(...history.map(h => Math.min(h.previousQuantityHagga + h.previousQuantityDeepDesert, h.newQuantityHagga + h.newQuantityDeepDesert))))}
                        </text>
                      </>
                    )}

                    {/* X-axis time labels */}
                    {history.length > 1 && history.slice().reverse().map((entry, index, arr) => {
                      if (index % Math.max(1, Math.floor(arr.length / 4)) !== 0 && index !== arr.length - 1) return null

                      const x = 10 + (index / Math.max(arr.length - 1, 1)) * 80
                      const date = new Date(entry.createdAt)
                      const timeLabel = date.toLocaleDateString() === new Date().toLocaleDateString()
                        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : date.toLocaleDateString([], { month: 'short', day: 'numeric' })

                      return (
                        <text
                          key={`time-${entry.id}`}
                          x={`${x}%`}
                          y="95"
                          fontSize="9"
                          fill="#6b7280"
                          className="text-xs"
                          textAnchor="middle"
                        >
                          {timeLabel}
                        </text>
                      )
                    })}
                  </svg>

                  {/* Hover Tooltip */}
                  {hoveredPoint && (
                    <div
                      className="absolute bg-black text-white text-xs rounded px-2 py-1 pointer-events-none z-10 whitespace-nowrap"
                      style={{
                        left: mousePosition.x + 10,
                        top: mousePosition.y - 10,
                        transform: mousePosition.x > 200 ? 'translateX(-100%)' : 'none'
                      }}
                    >
                      <div className="font-medium">{formatNumber(hoveredPoint.newQuantityHagga + hoveredPoint.newQuantityDeepDesert)}</div>
                      <div className="text-gray-300">
                        {hoveredPoint.changeAmountHagga + hoveredPoint.changeAmountDeepDesert > 0 ? '+' : ''}{formatNumber(hoveredPoint.changeAmountHagga + hoveredPoint.changeAmountDeepDesert)}
                      </div>
                      <div className="text-gray-300">By: {hoveredPoint.updatedBy}</div>
                      <div className="text-gray-300">{getRelativeTime(hoveredPoint.createdAt, currentTime)}</div>
                      <div className="text-blue-300 text-center mt-1">Click to highlight</div>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Increase</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Decrease</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                    <span>No Change</span>
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 ml-4">
                    💡 Hover points for details, click to highlight below • Times update automatically
                  </div>
                </div>
              </div>
            )}

            {!historyLoading && history.length <= 1 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>Not enough data points for chart</p>
                <p className="text-sm">At least 2 history entries needed</p>
              </div>
            )}
          </div>

          {/* Resource-Specific Contribution Leaderboard */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Contribution Leaderboard</h3>
              <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                Only +/- changes count
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Tracks contributions and consumption from relative changes (+500, -200, etc.) for this resource.
              Administrative value updates are not included.
            </div>

            {historyLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No activity in the selected time period
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Contributors */}
                <div>
                  <h4 className="text-md font-medium text-green-700 dark:text-green-300 mb-3">🏆 Top Contributors</h4>
                  <div className="space-y-2">
                    {Object.entries(calculateLeaderboard())
                      .filter(([_, stats]) => stats.contributed > 0)
                      .sort((a, b) => b[1].contributed - a[1].contributed)
                      .slice(0, 5)
                      .map(([user, stats], index) => (
                        <div key={user} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">#{index + 1}</span>
                            <span className="text-sm text-gray-900 dark:text-gray-100">{user}</span>
                          </div>
                          <span className="text-sm font-medium text-green-700 dark:text-green-300">+{formatNumber(stats.contributed)}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Top Consumers */}
                <div>
                  <h4 className="text-md font-medium text-red-700 dark:text-red-300 mb-3">📉 Top Consumers</h4>
                  <div className="space-y-2">
                    {Object.entries(calculateLeaderboard())
                      .filter(([_, stats]) => stats.taken > 0)
                      .sort((a, b) => b[1].taken - a[1].taken)
                      .slice(0, 5)
                      .map(([user, stats], index) => (
                        <div key={user} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">#{index + 1}</span>
                            <span className="text-sm text-gray-900 dark:text-gray-100">{user}</span>
                          </div>
                          <span className="text-sm font-medium text-red-700 dark:text-red-300">-{formatNumber(stats.taken)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Global Points Leaderboard */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">🏆 Points Leaderboard</h3>
              <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                Global rankings (last 7 days)
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Rankings based on points earned from resource contributions across all resources.
            </div>

            {leaderboardLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading leaderboard...</p>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                <p className="text-sm">No contributions in the selected time period</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.slice(0, 10).map((entry, index) => (
                  <div 
                    key={entry.userId} 
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg hover:from-green-100 hover:to-blue-100 dark:hover:from-green-900/30 dark:hover:to-blue-900/30 transition-all cursor-pointer"
                    onClick={() => router.push(`/dashboard/contributions/${entry.userId}`)}
                    title={`Click to view ${entry.userId}'s detailed contributions`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        index === 0 ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200' :
                        index === 1 ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200' :
                        index === 2 ? 'bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200' :
                        'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300'
                      }`}>
                        #{index + 1}
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {entry.userId}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        ({entry.totalActions} actions)
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {entry.totalPoints.toFixed(1)} pts
                      </div>
                      <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => router.push('/dashboard/leaderboard')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                  >
                    View Full Leaderboard
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* History Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Changes</h3>
              <div className="flex items-center gap-3">
                {selectedPointId && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    Point selected on chart
                  </div>
                )}
                {selectedPointId && (
                  <button
                    onClick={() => setSelectedPointId(null)}
                    className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/70 transition-colors"
                  >
                    Clear Selection
                  </button>
                )}
              </div>
            </div>



            {historyLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Loading history...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No changes in the last {timeFilter} {timeFilter === 1 ? 'day' : 'days'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((entry, index) => {
                  const isHighlighted = selectedPointId === entry.id

                  return (
                    <div
                      key={entry.id}
                      id={`history-entry-${entry.id}`}
                      className={`group flex items-center justify-between p-4 rounded-lg transition-all duration-300 cursor-pointer ${isHighlighted
                          ? 'bg-blue-100 dark:bg-blue-900/50 border-2 border-blue-300 dark:border-blue-500 shadow-md transform scale-[1.02]'
                          : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      onClick={() => setSelectedPointId(selectedPointId === entry.id ? null : entry.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${entry.changeAmountHagga + entry.changeAmountDeepDesert > 0 ? 'bg-green-500' :
                            entry.changeAmountHagga + entry.changeAmountDeepDesert < 0 ? 'bg-red-500' : 'bg-gray-400'
                          } ${isHighlighted ? 'ring-2 ring-blue-400 dark:ring-blue-500' : ''}`}></div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            {entry.changeType === 'transfer' ? (
                              <span>
                                Transfer {entry.transferAmount} {entry.transferDirection === 'to_deep_desert' ? 'to Deep Desert' : 'to Hagga'}
                              </span>
                            ) : (
                              <div>
                                <div>
                                  Hagga: {formatNumber(entry.previousQuantityHagga)} → {formatNumber(entry.newQuantityHagga)} ({entry.changeAmountHagga > 0 ? '+' : ''}{formatNumber(entry.changeAmountHagga)})
                                </div>
                                <div>
                                  Deep Desert: {formatNumber(entry.previousQuantityDeepDesert)} → {formatNumber(entry.newQuantityDeepDesert)} ({entry.changeAmountDeepDesert > 0 ? '+' : ''}{formatNumber(entry.changeAmountDeepDesert)})
                                </div>
                              </div>
                            )}
                            {/* Change Type Indicator */}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${entry.changeType === 'relative'
                                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                                : entry.changeType === 'transfer'
                                ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                              }`}>
                              {entry.changeType}
                            </span>
                            {isHighlighted && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 animate-pulse">
                                Selected
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            By <span className="font-medium">{entry.updatedBy}</span>
                            {entry.reason && (
                              <span className="ml-2 text-blue-600 dark:text-blue-400">• {entry.reason}</span>
                            )}
                            {entry.changeType === 'relative' && (
                              <span className="ml-2 text-green-600 dark:text-green-400 text-xs">• Counts toward leaderboard</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
                          <div
                            className="cursor-help hover:underline decoration-dotted"
                            title={`${new Date(entry.createdAt).toLocaleDateString()} at ${new Date(entry.createdAt).toLocaleTimeString()}`}
                          >
                            {getRelativeTime(entry.createdAt, currentTime)}
                          </div>
                          {isHighlighted && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">📍 Chart point</div>
                          )}
                        </div>
                        
                        {/* Delete button for admin users */}
                        {canDeleteHistory && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteHistoryEntry(entry.id)
                            }}
                            disabled={saving}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            title="Delete this history entry"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Congratulations Popup */}
      {congratulationsState.isVisible && (
        <CongratulationsPopup
          isVisible={congratulationsState.isVisible}
          onClose={() => setCongratulationsState({ ...congratulationsState, isVisible: false })}
          pointsEarned={congratulationsState.finalPoints}
          pointsCalculation={congratulationsState.pointsCalculation}
          resourceName={congratulationsState.resourceName}
          actionType={congratulationsState.actionType}
          quantityChanged={congratulationsState.quantityChanged}
          userId={session ? getUserIdentifier(session) : undefined}
        />
      )}
    </div>
  )
} 