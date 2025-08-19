'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CongratulationsPopup } from './CongratulationsPopup'
import { TransferModal } from './TransferModal'
import { UpdateQuantityModal } from './UpdateQuantityModal'
import { EditResourceModal } from './EditResourceModal'
import { getUserIdentifier } from '@/lib/auth'
import {
  CATEGORY_OPTIONS,
  COMPONENTS_CATEGORY,
  LEADERBOARD_API_PATH,
  LEADERBOARD_TIME_FILTERS,
  LOCAL_STORAGE_KEYS,
  MS_IN_HOUR,
  MS_IN_MINUTE,
  ONE_WEEK_IN_MS,
  RAW_CATEGORY,
  RESOURCES_API_PATH,
  RESOURCE_STATUS,
  RESOURCE_STATUS_THRESHOLDS,
  STALE_THRESHOLD_MS,
  STATUS_CHANGE_TIMEOUT_MS,
  UNCATEGORIZED,
  UPDATE_THRESHOLD_MS,
  UPDATE_TYPE,
  USER_ACTIVITY_API_PATH,
  WATER_RESOURCE_ID,
  VIEW_MODE,
} from '@/lib/constants'

// Utility function to format numbers with commas
const formatNumber = (num: number): string => {
  return num.toLocaleString()
}

// Calculate relative time
const getRelativeTime = (updatedAt: string): string => {
  const now = new Date()
  const past = new Date(updatedAt)
  const diffInMs = now.getTime() - past.getTime()
  const diffInMinutes = Math.floor(diffInMs / MS_IN_MINUTE)

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60)
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24)
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4)
    return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12)
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`

  const diffInYears = Math.floor(diffInDays / 365)
  const years = Math.floor(diffInMonths / 12)
  return `${years} year${years === 1 ? '' : 's'} ago`
}

// Calculate status based on quantity vs target
const calculateResourceStatus = (
  quantity: number,
  targetQuantity: number | null,
): (typeof RESOURCE_STATUS)[keyof typeof RESOURCE_STATUS] => {
  if (!targetQuantity || targetQuantity <= 0) return RESOURCE_STATUS.AT_TARGET

  const percentage = (quantity / targetQuantity) * 100
  if (percentage >= RESOURCE_STATUS_THRESHOLDS.ABOVE_TARGET)
    return RESOURCE_STATUS.ABOVE_TARGET // Purple - well above target
  if (percentage >= RESOURCE_STATUS_THRESHOLDS.AT_TARGET)
    return RESOURCE_STATUS.AT_TARGET // Green - at or above target
  if (percentage >= RESOURCE_STATUS_THRESHOLDS.BELOW_TARGET)
    return RESOURCE_STATUS.BELOW_TARGET // Orange - below target but not critical
  return RESOURCE_STATUS.CRITICAL // Red - very much below target
}

// Check if resource is stale (not updated in more than 48 hours)
const isResourceStale = (updatedAt: string): boolean => {
  const now = new Date()
  return now.getTime() - new Date(updatedAt).getTime() > STALE_THRESHOLD_MS
}

// Check if resource needs updating (not updated in more than 24 hours)
const needsUpdating = (updatedAt: string): boolean => {
  const now = new Date()
  return now.getTime() - new Date(updatedAt).getTime() > UPDATE_THRESHOLD_MS
}

// Function to get status background color for grid view
const getStatusBackgroundColor = (status: string): string => {
  switch (status) {
    case RESOURCE_STATUS.CRITICAL:
      return 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
    case RESOURCE_STATUS.BELOW_TARGET:
      return 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800'
    case RESOURCE_STATUS.AT_TARGET:
      return 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
    case RESOURCE_STATUS.ABOVE_TARGET:
      return 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800'
    default:
      return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
  }
}

const getStatusText = (status: string): string => {
  switch (status) {
    case RESOURCE_STATUS.CRITICAL:
      return 'Critical'
    case RESOURCE_STATUS.BELOW_TARGET:
      return 'Below Target'
    case RESOURCE_STATUS.AT_TARGET:
      return 'At Target'
    case RESOURCE_STATUS.ABOVE_TARGET:
      return 'Above Target'
    default:
      return 'Unknown'
  }
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case RESOURCE_STATUS.CRITICAL:
      return 'text-red-700 dark:text-red-300'
    case RESOURCE_STATUS.BELOW_TARGET:
      return 'text-orange-700 dark:text-orange-300'
    case RESOURCE_STATUS.AT_TARGET:
      return 'text-green-700 dark:text-green-300'
    case RESOURCE_STATUS.ABOVE_TARGET:
      return 'text-purple-700 dark:text-purple-300'
    default:
      return 'text-gray-700 dark:text-gray-300'
  }
}

// Function to get combined status styling for table view (background + text colors)
const getStatusTableColor = (status: string): string => {
  switch (status) {
    case RESOURCE_STATUS.CRITICAL:
      return 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'
    case RESOURCE_STATUS.BELOW_TARGET:
      return 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200'
    case RESOURCE_STATUS.AT_TARGET:
      return 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'
    case RESOURCE_STATUS.ABOVE_TARGET:
      return 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200'
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
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
  status?: string // Optional since we calculate this dynamically
  targetQuantity?: number
  multiplier?: number // Points multiplier for this resource
  lastUpdatedBy: string
  updatedAt: string
}

interface ResourceUpdate {
  id: string
  updateType: (typeof UPDATE_TYPE)[keyof typeof UPDATE_TYPE]
  value: number
  reason?: string
}

interface ResourceTableProps {
  userId: string
}

interface PointsCalculation {
  basePoints: number
  resourceMultiplier: number
  statusBonus: number
  finalPoints: number
}

interface LeaderboardEntry {
  userId: string
  totalPoints: number
  totalActions: number
}

interface CongratulationsState {
  isVisible: boolean
  pointsEarned: number
  pointsCalculation?: PointsCalculation
  resourceName: string
  actionType: 'ADD' | 'SET' | 'REMOVE'
  quantityChanged: number
}

// Note: Role checking now done server-side in auth.ts and passed via session.user.permissions

export function ResourceTable({ userId }: ResourceTableProps) {
  const { data: session } = useSession()
  const router = useRouter()

  // Use pre-computed permissions from session (computed server-side)
  const canEdit = session?.user?.permissions?.hasResourceAccess ?? false
  const isTargetAdmin =
    session?.user?.permissions?.hasTargetEditAccess ?? false
  const isResourceAdmin =
    session?.user?.permissions?.hasResourceAdminAccess ?? false

  const [resources, setResources] = useState<Resource[]>([])
  const [editedTargets, setEditedTargets] = useState<Map<string, number>>(
    new Map(),
  )
  const [
    statusChanges,
    setStatusChanges,
  ] = useState<Map<string, { oldStatus: string; newStatus: string; timestamp: number }>>(new Map())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [
    updateModes,
    setUpdateModes,
  ] = useState<Map<string, (typeof UPDATE_TYPE)[keyof typeof UPDATE_TYPE]>>(new Map())
  const [relativeValues, setRelativeValues] = useState<Map<string, number>>(
    new Map(),
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<
    (typeof VIEW_MODE)[keyof typeof VIEW_MODE]
  >(VIEW_MODE.GRID)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [activityLoading, setActivityLoading] = useState(true)

  // Leaderboard states
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(true)
  const [
    leaderboardTimeFilter,
    setLeaderboardTimeFilter,
  ] = useState<
    (typeof LEADERBOARD_TIME_FILTERS)[keyof typeof LEADERBOARD_TIME_FILTERS]
  >(LEADERBOARD_TIME_FILTERS['7D'])
  const [leaderboardExpanded, setLeaderboardExpanded] = useState(false)

  // Congratulations popup state
  const [congratulationsState, setCongratulationsState] = useState<
    CongratulationsState
  >({
    isVisible: false,
    pointsEarned: 0,
    resourceName: '',
    actionType: 'ADD',
    quantityChanged: 0,
  })

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>(
    LEADERBOARD_TIME_FILTERS.ALL,
  )
  const [needsUpdateFilter, setNeedsUpdateFilter] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Add state for update modal
  const [updateModalState, setUpdateModalState] = useState<{
    isOpen: boolean
    resource: Resource | null
    updateType: (typeof UPDATE_TYPE)[keyof typeof UPDATE_TYPE]
  }>({ isOpen: false, resource: null, updateType: UPDATE_TYPE.ABSOLUTE })

  // Admin state for resource editing
  const [editModalState, setEditModalState] = useState<{
    isOpen: boolean
    resource: Resource | null
  }>({ isOpen: false, resource: null })

  // Create new resource state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createResourceForm, setCreateResourceForm] = useState({
    name: '',
    category: RAW_CATEGORY,
    description: '',
    imageUrl: '',
    quantityHagga: 0,
    quantityDeepDesert: 0,
    targetQuantity: 0,
    multiplier: 1.0,
  })

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState({
    resourceId: null as string | null,
    resourceName: '',
    showDialog: false,
  })

  const [transferModalState, setTransferModalState] = useState<{
    isOpen: boolean
    resource: Resource | null
  }>({ isOpen: false, resource: null })

  // Load view preference
  useEffect(() => {
    const savedViewMode = localStorage.getItem(LOCAL_STORAGE_KEYS.VIEW_MODE)
    if (
      savedViewMode === VIEW_MODE.TABLE ||
      savedViewMode === VIEW_MODE.GRID
    ) {
      setViewMode(savedViewMode as (typeof VIEW_MODE)[keyof typeof VIEW_MODE])
    }
  }, [])

  // Save view preference
  const setAndSaveViewMode = (
    mode: (typeof VIEW_MODE)[keyof typeof VIEW_MODE],
  ) => {
    setViewMode(mode)
    localStorage.setItem(LOCAL_STORAGE_KEYS.VIEW_MODE, mode)
  }

  // Status options for filter dropdown
  const statusOptions = [
    { value: 'all', label: 'All Status', count: 0 },
    { value: RESOURCE_STATUS.CRITICAL, label: 'Critical', count: 0 },
    { value: RESOURCE_STATUS.BELOW_TARGET, label: 'Below Target', count: 0 },
    { value: RESOURCE_STATUS.AT_TARGET, label: 'At Target', count: 0 },
    { value: RESOURCE_STATUS.ABOVE_TARGET, label: 'Above Target', count: 0 },
  ]

  // Calculate status counts
  const statusCounts = resources.reduce(
    (acc, resource) => {
      const status = calculateResourceStatus(
        resource.quantityHagga + resource.quantityDeepDesert,
        resource.targetQuantity ?? null,
      )
      acc[status] = (acc[status] || 0) + 1
      acc.all = (acc.all || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Update status options with counts
  statusOptions.forEach((option) => {
    option.count = statusCounts[option.value] || 0
  })

  // Create category options for filter dropdown
  const categoryOptions = [
    { value: 'all', label: 'All Categories', count: 0 },
    ...CATEGORY_OPTIONS.map((cat) => ({ value: cat, label: cat, count: 0 })),
  ]

  // Calculate category counts
  const categoryCounts = resources.reduce(
    (acc, resource) => {
      const category = resource.category || UNCATEGORIZED
      acc[category] = (acc[category] || 0) + 1
      acc.all = (acc.all || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Update category options with counts
  categoryOptions.forEach((option) => {
    option.count = categoryCounts[option.value] || 0
  })

  // Calculate needs updating count
  const needsUpdateCount = resources.filter((resource) =>
    needsUpdating(resource.updatedAt),
  ).length

  // Fetch recent activity
  const fetchRecentActivity = useCallback(async () => {
    try {
      setActivityLoading(true)
      const response = await fetch(
        `${USER_ACTIVITY_API_PATH}?global=true&limit=50`,
        {
          headers: {
            'Cache-Control': 'no-cache',
          },
        },
      )
      if (response.ok) {
        const activity = await response.json()
        setRecentActivity(activity)
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error)
    } finally {
      setActivityLoading(false)
    }
  }, [])

  // Calculate top contributors from last week
  const calculateTopContributors = () => {
    const oneWeekAgo = new Date(Date.now() - ONE_WEEK_IN_MS)
    const contributors: { [key: string]: number } = {}

    recentActivity.forEach((activity) => {
      const activityDate = new Date(activity.createdAt)
      // Only include 'Raw Resources' and 'Components' categories, exclude water (resource ID 45)
      if (
        activityDate >= oneWeekAgo &&
        activity.changeType === UPDATE_TYPE.RELATIVE &&
        activity.changeAmount > 0 &&
        activity.resourceId !== WATER_RESOURCE_ID &&
        (activity.resourceCategory === RAW_CATEGORY ||
          activity.resourceCategory === COMPONENTS_CATEGORY)
      ) {
        contributors[activity.updatedBy] =
          (contributors[activity.updatedBy] || 0) + activity.changeAmount
      }
    })

    return Object.entries(contributors)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([user, amount]) => ({ user, amount }))
  }

  // Save view mode to localStorage whenever it changes
  const handleViewModeChange = (
    newViewMode: (typeof VIEW_MODE)[keyof typeof VIEW_MODE],
  ) => {
    setViewMode(newViewMode)
    localStorage.setItem(LOCAL_STORAGE_KEYS.VIEW_MODE, newViewMode)
  }

  // Navigate to resource detail page
  const handleResourceClick = (resourceId: string) => {
    router.push(`/resources/${resourceId}`)
  }

  // Update resource status immediately and track changes
  const updateResourceStatus = (
    resourceId: string,
    quantity: number,
    targetQuantity: number | null,
  ) => {
    const resource = resources.find((r) => r.id === resourceId)
    if (!resource) return

    const oldStatus = calculateResourceStatus(
      resource.quantityHagga + resource.quantityDeepDesert,
      resource.targetQuantity || null,
    )
    const newStatus = calculateResourceStatus(quantity, targetQuantity)

    if (oldStatus !== newStatus) {
      setStatusChanges(
        (prev) =>
          new Map(prev).set(resourceId, {
            oldStatus,
            newStatus,
            timestamp: Date.now(),
          }),
      )

      // Clear the status change indicator after 3 seconds
      setTimeout(() => {
        setStatusChanges((prev) => {
          const newMap = new Map(prev)
          newMap.delete(resourceId)
          return newMap
        })
      }, STATUS_CHANGE_TIMEOUT_MS)
    }
  }

  // Fetch resources from API
  const fetchResources = useCallback(async () => {
    try {
      setLoading(true)
      const timestamp = Date.now()
      const response = await fetch(`${RESOURCES_API_PATH}?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setResources(
          data.map((resource: any) => ({
            ...resource,
            updatedAt: new Date(resource.updatedAt).toISOString(),
            createdAt: new Date(resource.createdAt).toISOString(),
          })),
        )
      }
    } catch (error) {
      console.error('Error fetching resources:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle target quantity change (admin only)
  const handleTargetQuantityChange = (
    resourceId: string,
    newTarget: number,
  ) => {
    if (!isTargetAdmin) return

    const resource = resources.find((r) => r.id === resourceId)
    if (!resource) return

    setEditedTargets((prev) => new Map(prev).set(resourceId, newTarget))
    setResources((prev) =>
      prev.map((r) =>
        r.id === resourceId ? { ...r, targetQuantity: newTarget } : r,
      ),
    )

    // Update status immediately based on current quantity and new target
    updateResourceStatus(
      resourceId,
      resource.quantityHagga + resource.quantityDeepDesert,
      newTarget,
    )
  }

  const saveTargetQuantity = async (resourceId: string) => {
    if (!isTargetAdmin) return

    const newTarget = editedTargets.get(resourceId)
    if (newTarget === undefined) return

    setSaving(true)
    try {
      const response = await fetch(
        `${RESOURCES_API_PATH}/${resourceId}/target`,
        {
          method: 'PUT',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
          body: JSON.stringify({
            targetQuantity: newTarget,
          }),
        },
      )

      if (response.ok) {
        setEditedTargets((prev) => {
          const newMap = new Map(prev)
          newMap.delete(resourceId)
          return newMap
        })

        // Clear status change indicator since the save was successful
        setStatusChanges((prev) => {
          const newMap = new Map(prev)
          newMap.delete(resourceId)
          return newMap
        })
      } else {
        console.error('Failed to save target quantity')
      }
    } catch (error) {
      console.error('Error saving target quantity:', error)
    } finally {
      setSaving(false)
    }
  }

  // Admin function to start editing a resource
  const startEditResource = (resource: Resource) => {
    if (!isResourceAdmin) return
    setEditModalState({ isOpen: true, resource: resource })
  }

  // Admin function to save resource metadata changes
  const saveResourceMetadata = async (resourceId: string, formData: any) => {
    if (!isResourceAdmin) return

    setSaving(true)
    try {
      const response = await fetch(RESOURCES_API_PATH, {
        method: 'PUT',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          resourceMetadata: {
            id: resourceId,
            ...formData,
          },
        }),
      })

      if (response.ok) {
        const updatedResource = await response.json()
        setResources((prev) =>
          prev.map((r) =>
            r.id === resourceId ? { ...r, ...updatedResource } : r,
          ),
        )
        setEditModalState({ isOpen: false, resource: null })
      } else {
        console.error('Failed to update resource metadata')
        throw new Error('Failed to update resource metadata.')
      }
    } catch (error) {
      console.error('Error updating resource metadata:', error)
      throw error
    } finally {
      setSaving(false)
    }
  }

  // Admin function to create new resource
  const createNewResource = async () => {
    if (!isResourceAdmin) return

    if (!createResourceForm.name || !createResourceForm.category) {
      alert('Name and category are required')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(RESOURCES_API_PATH, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(createResourceForm),
      })

      if (response.ok) {
        const newResource = await response.json()
        setResources((prev) => [...prev, newResource])
        setShowCreateForm(false)
        setCreateResourceForm({
          name: '',
          category: RAW_CATEGORY,
          description: '',
          imageUrl: '',
          quantityHagga: 0,
          quantityDeepDesert: 0,
          targetQuantity: 0,
          multiplier: 1.0,
        })
      } else {
        console.error('Failed to create resource')
      }
    } catch (error) {
      console.error('Error creating resource:', error)
    } finally {
      setSaving(false)
    }
  }

  // Admin function to delete resource
  const handleTransfer = async (
    resourceId: string,
    amount: number,
    direction: 'to_deep_desert' | 'to_hagga',
  ) => {
    try {
      const response = await fetch(
        `${RESOURCES_API_PATH}/${resourceId}/transfer`,
        {
          method: 'PUT',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
          body: JSON.stringify({
            transferAmount: amount,
            transferDirection: direction,
          }),
        },
      )

      if (response.ok) {
        const { resource } = await response.json()
        setResources((prev) =>
          prev.map((r) => (r.id === resourceId ? { ...r, ...resource } : r)),
        )
      } else {
        const { error } = await response.json()
        throw new Error(error || 'Failed to transfer quantity.')
      }
    } catch (error) {
      console.error('Error transferring quantity:', error)
      throw error
    }
  }

  const handleUpdate = async (
    resourceId: string,
    amount: number,
    quantityField: 'quantityHagga' | 'quantityDeepDesert',
    updateType: 'absolute' | 'relative',
  ) => {
    const resource = resources.find((r) => r.id === resourceId)
    if (!resource) return

    let newQuantity: number
    if (updateType === UPDATE_TYPE.RELATIVE) {
      newQuantity = Math.max(0, resource[quantityField] + amount)
    } else {
      newQuantity = Math.max(0, amount)
    }

    try {
      const response = await fetch(`${RESOURCES_API_PATH}/${resourceId}`, {
        method: 'PUT',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          quantity: newQuantity,
          updateType: updateType,
          changeValue: amount,
          quantityField: quantityField,
        }),
      })

      if (response.ok) {
        const { resource } = await response.json()
        setResources((prev) =>
          prev.map((r) => (r.id === resourceId ? { ...r, ...resource } : r)),
        )
      } else {
        const { error } = await response.json()
        throw new Error(error || 'Failed to update quantity.')
      }
    } catch (error) {
      console.error('Error updating quantity:', error)
      throw error
    }
  }

  const deleteResource = async (resourceId: string) => {
    if (!isResourceAdmin) return

    setSaving(true)
    try {
      const response = await fetch(`${RESOURCES_API_PATH}/${resourceId}`, {
        method: 'DELETE',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })

      if (response.ok) {
        setResources((prev) => prev.filter((r) => r.id !== resourceId))
        setDeleteConfirm({
          resourceId: null,
          resourceName: '',
          showDialog: false,
        })
      } else {
        console.error('Failed to delete resource')
      }
    } catch (error) {
      console.error('Error deleting resource:', error)
    } finally {
      setSaving(false)
    }
  }

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async () => {
    try {
      setLeaderboardLoading(true)
      const response = await fetch(
        `${LEADERBOARD_API_PATH}?timeFilter=${leaderboardTimeFilter}&limit=10`,
        {
          headers: {
            'Cache-Control': 'no-cache',
          },
        },
      )
      if (response.ok) {
        const data = await response.json()
        setLeaderboard(data.leaderboard || [])
      } else {
        console.error(
          'Leaderboard API error:',
          response.status,
          response.statusText,
        )
        setLeaderboard([])
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      setLeaderboard([])
    } finally {
      setLeaderboardLoading(false)
    }
  }, [leaderboardTimeFilter])

  // Fetch resources on component mount
  useEffect(() => {
    fetchResources()
    fetchRecentActivity()
  }, [fetchResources, fetchRecentActivity])

  // Fetch leaderboard when time filter changes
  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  // Filter resources based on search term and filters
  const filteredResources = resources
    .filter((resource) => {
      const searchLower = searchTerm.toLowerCase()
      const resourceNameLower = resource.name.toLowerCase()

      // Text search filter
      let matchesSearch = true
      if (searchTerm) {
        // Exact name match (highest priority)
        if (resourceNameLower === searchLower) {
          matchesSearch = true
        }
        // Partial name match (high priority)
        else if (resourceNameLower.includes(searchLower)) {
          matchesSearch = true
        }
        // Extended search: only for longer search terms (6+ characters) to avoid broad matches
        else if (searchLower.length >= 6) {
          matchesSearch =
            (resource.description?.toLowerCase().includes(searchLower) ??
              false) ||
            (resource.category?.toLowerCase().includes(searchLower) ?? false)
        } else {
          matchesSearch = false
        }
      }

      // Status filter
      let matchesStatus = true
      if (statusFilter !== LEADERBOARD_TIME_FILTERS.ALL) {
        const resourceStatus = calculateResourceStatus(
          resource.quantityHagga + resource.quantityDeepDesert,
          resource.targetQuantity ?? null,
        )
        matchesStatus = resourceStatus === statusFilter
      }

      // Needs updating filter
      let matchesNeedsUpdate = true
      if (needsUpdateFilter) {
        matchesNeedsUpdate = needsUpdating(resource.updatedAt)
      }

      // Category filter
      let matchesCategory = true
      if (categoryFilter !== 'all') {
        matchesCategory = (resource.category || UNCATEGORIZED) === categoryFilter
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesNeedsUpdate &&
        matchesCategory
      )
    })
    .sort((a, b) => {
      // If there's a search term, sort by search relevance
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const aNameLower = a.name.toLowerCase()
        const bNameLower = b.name.toLowerCase()

        // Exact name matches first
        const aExact = aNameLower === searchLower
        const bExact = bNameLower === searchLower
        if (aExact && !bExact) return -1
        if (!aExact && bExact) return 1

        // Then partial name matches (by position in name)
        const aNameMatch = aNameLower.includes(searchLower)
        const bNameMatch = bNameLower.includes(searchLower)
        if (aNameMatch && !bNameMatch) return -1
        if (!aNameMatch && bNameMatch) return 1

        // If both are name matches, sort by position of match
        if (aNameMatch && bNameMatch) {
          const aIndex = aNameLower.indexOf(searchLower)
          const bIndex = bNameLower.indexOf(searchLower)
          if (aIndex !== bIndex) return aIndex - bIndex
        }
      }

      // Default sort by name
      return a.name.localeCompare(b.name)
    })

  // Group resources by category for grid view
  const groupedResources = filteredResources.reduce(
    (acc, resource) => {
      const category = resource.category || UNCATEGORIZED
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(resource)
      return acc
    },
    {} as Record<string, Resource[]>,
  )

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Loading resources...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Updates */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Recent Updates
            </h3>
            <svg
              className="w-5 h-5 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {activityLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Loading updates...
              </p>
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              <p className="text-sm">No recent updates</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                  onClick={() => handleResourceClick(activity.resourceId)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activity.changeAmount > 0
                          ? 'bg-green-500'
                          : activity.changeAmount < 0
                            ? 'bg-red-500'
                            : 'bg-gray-400'
                      }`}
                    ></div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {activity.resourceName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        By {activity.updatedBy} •{' '}
                        {getRelativeTime(activity.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      activity.changeAmount > 0
                        ? 'text-green-600 dark:text-green-400'
                        : activity.changeAmount < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {activity.changeAmount > 0 ? '+' : ''}
                    {formatNumber(activity.changeAmount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              🏆 Leaderboard
            </h3>
            <div className="flex items-center gap-2">
              <select
                value={leaderboardTimeFilter}
                onChange={(e) =>
                  setLeaderboardTimeFilter(
                    e.target
                      .value as (typeof LEADERBOARD_TIME_FILTERS)[keyof typeof LEADERBOARD_TIME_FILTERS],
                  )
                }
                className="text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-sm px-2 py-1"
              >
                <option value={LEADERBOARD_TIME_FILTERS['24H']}>24h</option>
                <option value={LEADERBOARD_TIME_FILTERS['7D']}>7d</option>
                <option value={LEADERBOARD_TIME_FILTERS['30D']}>30d</option>
                <option value={LEADERBOARD_TIME_FILTERS.ALL}>All</option>
              </select>
              <svg
                className="w-5 h-5 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
          </div>

          {leaderboardLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Loading leaderboard...
              </p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              <p className="text-sm">No contributions in this time period</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard
                .slice(0, leaderboardExpanded ? leaderboard.length : 5)
                .map((entry, index) => (
                  <div
                    key={entry.userId}
                    className="flex items-center justify-between p-3 bg-linear-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg hover:from-green-100 hover:to-blue-100 dark:hover:from-green-900/30 dark:hover:to-blue-900/30 transition-all cursor-pointer"
                    onClick={() =>
                      router.push(`/dashboard/contributions/${entry.userId}`)
                    }
                    title={`Click to view ${entry.userId}'s detailed contributions`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          index === 0
                            ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
                            : index === 1
                              ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                              : index === 2
                                ? 'bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200'
                                : 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300'
                        }`}
                      >
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
                      <svg
                        className="w-4 h-4 text-gray-400 dark:text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                ))}

              <div className="space-y-2">
                {leaderboard.length > 5 && (
                  <button
                    onClick={() => setLeaderboardExpanded(!leaderboardExpanded)}
                    className="w-full text-center py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                  >
                    {leaderboardExpanded
                      ? 'Show Less'
                      : `Show All ${leaderboard.length} Contributors`}
                  </button>
                )}

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
      </div>

      {/* Admin Panel */}
      {isResourceAdmin && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                Admin Panel
              </h3>
            </div>
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add New Resource
              </button>
            )}
          </div>

          {showCreateForm && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">
                Create New Resource
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={createResourceForm.name}
                    onChange={(e) =>
                      setCreateResourceForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Resource name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={createResourceForm.category}
                    onChange={(e) =>
                      setCreateResourceForm((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={createResourceForm.description}
                    onChange={(e) =>
                      setCreateResourceForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Optional description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={createResourceForm.imageUrl}
                    onChange={(e) =>
                      setCreateResourceForm((prev) => ({
                        ...prev,
                        imageUrl: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Initial Quantity (Hagga)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={createResourceForm.quantityHagga}
                    onChange={(e) =>
                      setCreateResourceForm((prev) => ({
                        ...prev,
                        quantityHagga: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Initial Quantity (Deep Desert)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={createResourceForm.quantityDeepDesert}
                    onChange={(e) =>
                      setCreateResourceForm((prev) => ({
                        ...prev,
                        quantityDeepDesert: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Target Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={createResourceForm.targetQuantity}
                    onChange={(e) =>
                      setCreateResourceForm((prev) => ({
                        ...prev,
                        targetQuantity: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Points Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={createResourceForm.multiplier}
                    onChange={(e) =>
                      setCreateResourceForm((prev) => ({
                        ...prev,
                        multiplier: parseFloat(e.target.value) || 1.0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="1.0"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Points multiplier for this resource (e.g., 0.1 for
                    low-value, 5.0 for high-value)
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={createNewResource}
                  disabled={
                    saving ||
                    !createResourceForm.name ||
                    !createResourceForm.category
                  }
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {saving ? 'Creating...' : 'Create Resource'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false)
                    setCreateResourceForm({
                      name: '',
                      category: RAW_CATEGORY,
                      description: '',
                      imageUrl: '',
                      quantityHagga: 0,
                      quantityDeepDesert: 0,
                      targetQuantity: 0,
                      multiplier: 1.0,
                    })
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search and View Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-4">
          {/* Search and Filters Row */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <svg
                className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* View Toggle Buttons */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setAndSaveViewMode(VIEW_MODE.TABLE)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === VIEW_MODE.TABLE
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
                Table
              </button>
              <button
                onClick={() => setAndSaveViewMode(VIEW_MODE.GRID)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === VIEW_MODE.GRID
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                Grid
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Status:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Category:
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Needs Updating Filter */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={needsUpdateFilter}
                  onChange={(e) => setNeedsUpdateFilter(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span>Needs updating ({needsUpdateCount})</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  (24+ hours)
                </span>
              </label>
            </div>

            {/* Active Filters Indicator */}
            {(statusFilter !== 'all' ||
              needsUpdateFilter ||
              searchTerm ||
              categoryFilter !== 'all') && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>
                  Showing {filteredResources.length} of {resources.length}{' '}
                  resources
                </span>
                <button
                  onClick={() => {
                    setStatusFilter('all')
                    setNeedsUpdateFilter(false)
                    setSearchTerm('')
                    setCategoryFilter('all')
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Helper text */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
          💡 Click any resource to view detailed history and analytics
        </p>
      </div>

      {/* Grid View */}
      {viewMode === VIEW_MODE.GRID && (
        <div className="space-y-8">
          {Object.entries(groupedResources)
            .sort(([categoryA], [categoryB]) => {
              // Define the desired order: Raw → Refined → Components → Other categories
              const order = [RAW_CATEGORY, 'Refined', COMPONENTS_CATEGORY]
              const indexA = order.indexOf(categoryA)
              const indexB = order.indexOf(categoryB)

              // If both categories are in the defined order, sort by their position
              if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB
              }
              // If only one is in the defined order, prioritize it
              if (indexA !== -1) return -1
              if (indexB !== -1) return 1
              // If neither is in the defined order, sort alphabetically
              return categoryA.localeCompare(categoryB)
            })
            .map(([category, categoryResources]) => (
              <div key={category} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                  {category} ({categoryResources.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {categoryResources.map((resource) => {
                    const status = calculateResourceStatus(
                      resource.quantityHagga + resource.quantityDeepDesert,
                      resource.targetQuantity || null,
                    )
                    const statusChange = statusChanges.get(resource.id)
                    const isStale = isResourceStale(resource.updatedAt)

                    return (
                      <div
                        key={resource.id}
                        className={`${
                          resource.category === 'Blueprints'
                            ? 'bg-purple-200 dark:bg-violet-900/50'
                            : 'bg-white dark:bg-gray-800'
                        } border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group ${
                          isStale
                            ? 'border-amber-300 dark:border-amber-600 ring-1 ring-amber-200 dark:ring-amber-800'
                            : 'border-gray-200 dark:border-gray-700'
                        } ${
                          isStale && resource.category !== 'Blueprints'
                            ? 'bg-amber-50/50 dark:bg-amber-900/10'
                            : ''
                        }`}
                        onClick={() => handleResourceClick(resource.id)}
                        title={
                          isStale
                            ? '⚠️ Not updated in 48+ hours - Click to view details'
                            : 'Click to view detailed resource information'
                        }
                      >
                        {/* Resource Image */}
                        <div className="aspect-square mb-3 relative">
                          {resource.imageUrl ? (
                            <img
                              src={resource.imageUrl}
                              alt={resource.name}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                const fallback = target.nextElementSibling as HTMLElement
                                if (fallback) fallback.style.display = 'flex'
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-full h-full rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center ${
                              resource.imageUrl ? 'hidden' : 'flex'
                            }`}
                          >
                            <span className="text-gray-400 dark:text-gray-500 text-xs">
                              No Image
                            </span>
                          </div>

                          {/* Click indicator */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg
                              className="w-4 h-4 text-blue-600 dark:text-blue-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                        </div>

                        {/* Resource Info */}
                        <div
                          className="space-y-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {resource.name}
                          </h4>

                          {/* Status Badge */}
                          <div className="flex items-center justify-between">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                status,
                              )} ${statusChange ? 'animate-pulse' : ''}`}
                            >
                              {getStatusText(status)}
                            </span>

                            {/* Multiplier Badge */}
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                resource.multiplier === 0
                                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                  : (resource.multiplier || 1.0) >= 3.0
                                    ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200'
                                    : (resource.multiplier || 1.0) >= 2.0
                                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'
                                      : (resource.multiplier || 1.0) >= 1.0
                                        ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'
                                        : 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200'
                              }`}
                            >
                              {resource.multiplier === 0
                                ? '0x'
                                : (resource.multiplier || 1.0).toFixed(1) +
                                  'x'}
                            </span>
                          </div>

                          {/* Quantity Display */}
                          <div className="text-center">
                            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                              Hagga: {formatNumber(resource.quantityHagga)}
                            </div>
                            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                              Deep Desert:{' '}
                              {formatNumber(resource.quantityDeepDesert)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {resource.targetQuantity
                                ? `Target: ${formatNumber(
                                    resource.targetQuantity,
                                  )}`
                                : 'No target set'}
                            </div>
                          </div>

                          {/* Last Updated Info */}
                          <div className="text-center pt-2 border-t border-gray-100 dark:border-gray-700">
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Updated by{' '}
                              <span className="font-medium text-gray-600 dark:text-gray-300">
                                {resource.lastUpdatedBy}
                              </span>
                            </div>
                            <div className="flex items-center justify-center gap-1">
                              {isStale && (
                                <svg
                                  className="w-3 h-3 text-amber-500 dark:text-amber-400"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                              <div
                                className={`text-xs cursor-help hover:underline decoration-dotted ${
                                  isStale
                                    ? 'text-amber-600 dark:text-amber-400 font-medium'
                                    : 'text-gray-400 dark:text-gray-500'
                                }`}
                                title={new Date(
                                  resource.updatedAt,
                                ).toLocaleString()}
                              >
                                {getRelativeTime(resource.updatedAt)}
                              </div>
                            </div>
                          </div>

                          {/* Simplified Quick Update Controls - Only show on hover for grid view */}
                          <div className="space-y-2 pt-2">
                            <div className="space-y-2">
                              {/* Regular quantity update buttons */}
                              <div className="flex gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setUpdateModalState({
                                      isOpen: true,
                                      resource: resource,
                                      updateType: UPDATE_TYPE.RELATIVE,
                                    })
                                  }}
                                  className="flex-1 bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-sm text-xs font-medium transition-colors"
                                >
                                  Add/Remove
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setUpdateModalState({
                                      isOpen: true,
                                      resource: resource,
                                      updateType: UPDATE_TYPE.ABSOLUTE,
                                    })
                                  }}
                                  className="flex-1 bg-purple-100 dark:bg-purple-900/50 hover:bg-purple-200 dark:hover:bg-purple-900/70 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-sm text-xs font-medium transition-colors"
                                >
                                  Set
                                </button>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setTransferModalState({
                                      isOpen: true,
                                      resource: resource,
                                    })
                                  }}
                                  className="flex-1 bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-900/70 text-green-700 dark:text-green-300 px-2 py-1 rounded-sm text-xs font-medium transition-colors"
                                >
                                  Transfer
                                </button>
                              </div>

                              {/* Admin buttons */}
                              {isResourceAdmin && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      startEditResource(resource)
                                    }}
                                    className="flex-1 bg-yellow-100 dark:bg-yellow-900/50 hover:bg-yellow-200 dark:hover:bg-yellow-900/70 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-sm text-xs font-medium transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setDeleteConfirm({
                                        resourceId: resource.id,
                                        resourceName: resource.name,
                                        showDialog: true,
                                      })
                                    }}
                                    className="flex-1 bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-900/70 text-red-700 dark:text-red-300 px-2 py-1 rounded-sm text-xs font-medium transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === VIEW_MODE.TABLE && (
        <div className="bg-white dark:bg-gray-800 shadow-xs rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Multiplier
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Quantity
                  </th>
                  {isTargetAdmin && (
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Target
                    </th>
                  )}
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredResources.map((resource) => {
                  const status = calculateResourceStatus(
                    resource.quantityHagga + resource.quantityDeepDesert,
                    resource.targetQuantity || 0,
                  )
                  const statusChange = statusChanges.get(resource.id)
                  const pendingTarget = editedTargets.get(resource.id)
                  const isEdited = pendingTarget !== undefined
                  const isStale = isResourceStale(resource.updatedAt)

                  return (
                    <tr
                      key={resource.id}
                      className={`cursor-pointer transition-colors group ${
                        isStale
                          ? 'border-l-4 border-l-amber-400 dark:border-l-amber-500'
                          : ''
                      } ${
                        resource.category === 'Blueprints'
                          ? 'bg-purple-200 dark:bg-violet-900/50'
                          : isStale
                          ? 'bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-100/50 dark:hover:bg-amber-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => handleResourceClick(resource.id)}
                      title={
                        isStale
                          ? '⚠️ Not updated in 48+ hours - Click to view details'
                          : 'Click to view detailed resource information'
                      }
                    >
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="shrink-0 h-12 w-12">
                            {resource.imageUrl ? (
                              <img
                                className="h-12 w-12 rounded-lg object-cover"
                                src={resource.imageUrl}
                                alt={resource.name}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  const fallback = target.nextElementSibling as HTMLElement
                                  if (fallback)
                                    fallback.style.display = 'flex'
                                }}
                              />
                            ) : null}
                            <div
                              className={`h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center ${
                                resource.imageUrl ? 'hidden' : 'flex'
                              }`}
                            >
                              <span className="text-gray-400 dark:text-gray-500 text-xs">
                                No image
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {resource.name}
                              <svg
                                className="w-3 h-3 inline ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                          {resource.category || UNCATEGORIZED}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            resource.multiplier === 0
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                              : (resource.multiplier || 1.0) >= 3.0
                                ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200'
                                : (resource.multiplier || 1.0) >= 2.0
                                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'
                                  : (resource.multiplier || 1.0) >= 1.0
                                    ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'
                                    : 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200'
                          }`}
                        >
                          {resource.multiplier === 0
                            ? '0x'
                            : (resource.multiplier || 1.0).toFixed(1) + 'x'}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusTableColor(
                            status,
                          )} ${statusChange ? 'animate-pulse' : ''}`}
                        >
                          {getStatusText(status)}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        Hagga: {formatNumber(resource.quantityHagga)}
                        <br />
                        Deep Desert:{' '}
                        {formatNumber(resource.quantityDeepDesert)}
                      </td>
                      {isTargetAdmin && (
                        <td
                          className="px-3 py-3 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              value={
                                pendingTarget ?? resource.targetQuantity ?? ''
                              }
                              onChange={(e) =>
                                handleTargetQuantityChange(
                                  resource.id,
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              placeholder="Target"
                            />
                            {isEdited && (
                              <button
                                onClick={() => saveTargetQuantity(resource.id)}
                                disabled={saving}
                                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 text-white px-2 py-1 rounded-sm text-xs transition-colors"
                              >
                                Save
                              </button>
                            )}
                          </div>
                        </td>
                      )}

                      <td
                        className="px-3 py-3 whitespace-nowrap text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="space-y-2">
                          <div className="space-y-2">
                            {/* Regular quantity update buttons */}
                            <div className="flex gap-1">
                              <button
                                onClick={() =>
                                  setUpdateModalState({
                                    isOpen: true,
                                    resource: resource,
                                    updateType: UPDATE_TYPE.RELATIVE,
                                  })
                                }
                                className="flex-1 bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-sm text-xs font-medium transition-colors"
                              >
                                Add/Remove
                              </button>
                              <button
                                onClick={() =>
                                  setUpdateModalState({
                                    isOpen: true,
                                    resource: resource,
                                    updateType: UPDATE_TYPE.ABSOLUTE,
                                  })
                                }
                                className="flex-1 bg-purple-100 dark:bg-purple-900/50 hover:bg-purple-200 dark:hover:bg-purple-900/70 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-sm text-xs font-medium transition-colors"
                              >
                                Set
                              </button>
                            </div>

                            {/* Admin buttons */}
                            {isResourceAdmin && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => startEditResource(resource)}
                                  className="flex-1 bg-yellow-100 dark:bg-yellow-900/50 hover:bg-yellow-200 dark:hover:bg-yellow-900/70 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-sm text-xs font-medium transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() =>
                                    setDeleteConfirm({
                                      resourceId: resource.id,
                                      resourceName: resource.name,
                                      showDialog: true,
                                    })
                                  }
                                  className="flex-1 bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-900/70 text-red-700 dark:text-red-300 px-2 py-1 rounded-sm text-xs font-medium transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredResources.length === 0 && !loading && (
        <div className="text-center py-12">
          {searchTerm ? (
            <div>
              <p className="text-gray-500 dark:text-gray-400">
                No resources found matching &quot;{searchTerm}&quot;
              </p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
              >
                Clear search
              </button>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              No resources found
            </p>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.888-.833-2.664 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Delete Resource
              </h3>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Are you sure you want to delete{' '}
                <strong>&quot;{deleteConfirm.resourceName}&quot;</strong>?
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.888-.833-2.664 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium text-red-800 dark:text-red-200 mb-1">
                      Warning: This action cannot be undone
                    </p>
                    <p className="text-red-700 dark:text-red-300">
                      This will permanently delete the resource and{' '}
                      <strong>all its history data</strong>. All tracking
                      records, changes, and analytics for this resource will be
                      lost forever.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() =>
                  setDeleteConfirm({
                    resourceId: null,
                    resourceName: '',
                    showDialog: false,
                  })
                }
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.resourceId) {
                    deleteResource(deleteConfirm.resourceId)
                  }
                }}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 disabled:opacity-50 rounded-lg transition-colors"
              >
                {saving ? 'Deleting...' : 'Delete Resource'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Congratulations Popup */}
      {transferModalState.isOpen && transferModalState.resource && (
        <TransferModal
          isOpen={transferModalState.isOpen}
          resource={transferModalState.resource}
          onClose={() =>
            setTransferModalState({ isOpen: false, resource: null })
          }
          onTransfer={handleTransfer}
        />
      )}
      {updateModalState.isOpen && updateModalState.resource && (
        <UpdateQuantityModal
          isOpen={updateModalState.isOpen}
          resource={updateModalState.resource}
          onClose={() =>
            setUpdateModalState({
              isOpen: false,
              resource: null,
              updateType: UPDATE_TYPE.ABSOLUTE,
            })
          }
          onUpdate={handleUpdate}
          updateType={updateModalState.updateType}
        />
      )}
      <EditResourceModal
        isOpen={editModalState.isOpen}
        onClose={() => setEditModalState({ isOpen: false, resource: null })}
        onSave={saveResourceMetadata}
        resource={editModalState.resource}
      />
      <CongratulationsPopup
        isVisible={congratulationsState.isVisible}
        pointsEarned={congratulationsState.pointsEarned}
        pointsCalculation={congratulationsState.pointsCalculation}
        resourceName={congratulationsState.resourceName}
        actionType={congratulationsState.actionType}
        quantityChanged={congratulationsState.quantityChanged}
        userId={session ? getUserIdentifier(session) : userId}
        onClose={() =>
          setCongratulationsState({ ...congratulationsState, isVisible: false })
        }
      />
    </div>
  )
}
