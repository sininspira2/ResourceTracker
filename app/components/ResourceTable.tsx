"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CongratulationsPopup } from "./CongratulationsPopup";
import { TransferModal } from "./TransferModal";
import { UpdateQuantityModal } from "./UpdateQuantityModal";
import { EditResourceModal } from "./EditResourceModal";
import { ChangeTargetModal } from "./ChangeTargetModal";
import { AlertTriangle, Trash2 } from "lucide-react";
import { BulkActions } from "./BulkActions";
import { getUserIdentifier } from "@/lib/auth";
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
  BP_CATEGORY,
  RESOURCES_API_PATH,
  RESOURCE_STATUS,
  RESOURCE_STATUS_THRESHOLDS,
  STATUS_CHANGE_TIMEOUT_MS,
  UNCATEGORIZED,
  UPDATE_THRESHOLD_PRIORITY_MS,
  UPDATE_THRESHOLD_NON_PRIORITY_MS,
  UPDATE_TYPE,
  USER_ACTIVITY_API_PATH,
  WATER_RESOURCE_ID,
  VIEW_MODE,
} from "@/lib/constants";

// Utility function to format numbers with commas
const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

// Calculate relative time
const getRelativeTime = (updatedAt: string): string => {
  const now = new Date();
  const past = new Date(updatedAt);
  const diffInMs = now.getTime() - past.getTime();
  const diffInMinutes = Math.floor(diffInMs / MS_IN_MINUTE);

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60)
    return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24)
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7)
    return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4)
    return `${diffInWeeks} week${diffInWeeks === 1 ? "" : "s"} ago`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12)
    return `${diffInMonths} month${diffInMonths === 1 ? "" : "s"} ago`;

  const diffInYears = Math.floor(diffInDays / 365);
  const years = Math.floor(diffInMonths / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
};

// Calculate status based on quantity vs target
const calculateResourceStatus = (
  quantity: number,
  targetQuantity: number | null,
): (typeof RESOURCE_STATUS)[keyof typeof RESOURCE_STATUS] => {
  if (!targetQuantity || targetQuantity <= 0) return RESOURCE_STATUS.AT_TARGET;

  const percentage = (quantity / targetQuantity) * 100;
  if (percentage >= RESOURCE_STATUS_THRESHOLDS.ABOVE_TARGET)
    return RESOURCE_STATUS.ABOVE_TARGET; // Purple - well above target
  if (percentage >= RESOURCE_STATUS_THRESHOLDS.AT_TARGET)
    return RESOURCE_STATUS.AT_TARGET; // Green - at or above target
  if (percentage >= RESOURCE_STATUS_THRESHOLDS.BELOW_TARGET)
    return RESOURCE_STATUS.BELOW_TARGET; // Orange - below target but not critical
  return RESOURCE_STATUS.CRITICAL; // Red - very much below target
};

// Check if resource needs updating (not updated in more than 24 hours for priority, 7 days for non-priority)
const needsUpdating = (updatedAt: string, isPriority: boolean): boolean => {
  const now = new Date();
  const threshold = isPriority
    ? UPDATE_THRESHOLD_PRIORITY_MS
    : UPDATE_THRESHOLD_NON_PRIORITY_MS;
  return now.getTime() - new Date(updatedAt).getTime() > threshold;
};

const getStatusText = (status: string): string => {
  switch (status) {
    case RESOURCE_STATUS.CRITICAL:
      return "Critical";
    case RESOURCE_STATUS.BELOW_TARGET:
      return "Below Target";
    case RESOURCE_STATUS.AT_TARGET:
      return "At Target";
    case RESOURCE_STATUS.ABOVE_TARGET:
      return "Above Target";
    default:
      return "Unknown";
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case RESOURCE_STATUS.CRITICAL:
      return "text-status-critical-text";
    case RESOURCE_STATUS.BELOW_TARGET:
      return "text-status-below-target-text";
    case RESOURCE_STATUS.AT_TARGET:
      return "text-status-at-target-text";
    case RESOURCE_STATUS.ABOVE_TARGET:
      return "text-status-above-target-text";
    default:
      return "text-status-default-text";
  }
};

const getStatusTableColor = (status: string): string => {
  switch (status) {
    case RESOURCE_STATUS.CRITICAL:
      return "bg-status-critical-bg text-status-critical-text";
    case RESOURCE_STATUS.BELOW_TARGET:
      return "bg-status-below-target-bg text-status-below-target-text";
    case RESOURCE_STATUS.AT_TARGET:
      return "bg-status-at-target-bg text-status-at-target-text";
    case RESOURCE_STATUS.ABOVE_TARGET:
      return "bg-status-above-target-bg text-status-above-target-text";
    default:
      return "bg-status-default-bg text-status-default-text";
  }
};

interface Resource {
  id: string;
  name: string;
  quantityHagga: number;
  quantityDeepDesert: number;
  description?: string;
  category?: string;
  icon?: string;
  imageUrl?: string;
  status?: string; // Optional since we calculate this dynamically
  targetQuantity?: number;
  multiplier?: number; // Points multiplier for this resource
  isPriority?: boolean;
  lastUpdatedBy: string;
  updatedAt: string;
}

interface ResourceUpdate {
  id: string;
  updateType: (typeof UPDATE_TYPE)[keyof typeof UPDATE_TYPE];
  value: number;
  reason?: string;
}

interface ResourceTableProps {
  userId: string;
}

interface PointsCalculation {
  basePoints: number;
  resourceMultiplier: number;
  statusBonus: number;
  finalPoints: number;
}

interface LeaderboardEntry {
  userId: string;
  totalPoints: number;
  totalActions: number;
}

interface CongratulationsState {
  isVisible: boolean;
  pointsEarned: number;
  pointsCalculation?: PointsCalculation;
  resourceName: string;
  actionType: "ADD" | "SET" | "REMOVE";
  quantityChanged: number;
}

// Note: Role checking now done server-side in auth.ts and passed via session.user.permissions

export function ResourceTable({ userId }: ResourceTableProps) {
  const { data: session } = useSession();
  const router = useRouter();

  // Use pre-computed permissions from session (computed server-side)
  const canEdit = session?.user?.permissions?.hasResourceAccess ?? false;
  const isTargetAdmin =
    session?.user?.permissions?.hasTargetEditAccess ?? false;
  const isResourceAdmin =
    session?.user?.permissions?.hasResourceAdminAccess ?? false;

  const [resources, setResources] = useState<Resource[]>([]);
  const [statusChanges, setStatusChanges] = useState<
    Map<string, { oldStatus: string; newStatus: string; timestamp: number }>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updateModes, setUpdateModes] = useState<
    Map<string, (typeof UPDATE_TYPE)[keyof typeof UPDATE_TYPE]>
  >(new Map());
  const [relativeValues, setRelativeValues] = useState<Map<string, number>>(
    new Map(),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<
    (typeof VIEW_MODE)[keyof typeof VIEW_MODE]
  >(VIEW_MODE.GRID);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // Leaderboard states
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardTimeFilter, setLeaderboardTimeFilter] = useState<
    (typeof LEADERBOARD_TIME_FILTERS)[keyof typeof LEADERBOARD_TIME_FILTERS]
  >(LEADERBOARD_TIME_FILTERS["7D"]);
  const [leaderboardExpanded, setLeaderboardExpanded] = useState(false);

  // Congratulations popup state
  const [congratulationsState, setCongratulationsState] =
    useState<CongratulationsState>({
      isVisible: false,
      pointsEarned: 0,
      resourceName: "",
      actionType: "ADD",
      quantityChanged: 0,
    });

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>(
    LEADERBOARD_TIME_FILTERS.ALL,
  );
  const [needsUpdateFilter, setNeedsUpdateFilter] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState(false);

  // Add state for update modal
  const [updateModalState, setUpdateModalState] = useState<{
    isOpen: boolean;
    resource: Resource | null;
    updateType: (typeof UPDATE_TYPE)[keyof typeof UPDATE_TYPE];
  }>({ isOpen: false, resource: null, updateType: UPDATE_TYPE.ABSOLUTE });

  // Admin state for resource editing
  const [editModalState, setEditModalState] = useState<{
    isOpen: boolean;
    resource: Resource | null;
  }>({ isOpen: false, resource: null });

  const [changeTargetModalState, setChangeTargetModalState] = useState<{
    isOpen: boolean;
    resource: Resource | null;
  }>({ isOpen: false, resource: null });

  // Create new resource state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createResourceForm, setCreateResourceForm] = useState({
    name: "",
    category: RAW_CATEGORY,
    description: "",
    imageUrl: "",
    quantityHagga: 0,
    quantityDeepDesert: 0,
    targetQuantity: 0,
    multiplier: 1.0,
  });

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState({
    resourceId: null as string | null,
    resourceName: "",
    showDialog: false,
  });

  const [transferModalState, setTransferModalState] = useState<{
    isOpen: boolean;
    resource: Resource | null;
  }>({ isOpen: false, resource: null });

  // Load view preference
  useEffect(() => {
    const savedViewMode = localStorage.getItem(LOCAL_STORAGE_KEYS.VIEW_MODE);
    if (savedViewMode === VIEW_MODE.TABLE || savedViewMode === VIEW_MODE.GRID) {
      setViewMode(savedViewMode as (typeof VIEW_MODE)[keyof typeof VIEW_MODE]);
    }
  }, []);

  // Save view preference
  const setAndSaveViewMode = (
    mode: (typeof VIEW_MODE)[keyof typeof VIEW_MODE],
  ) => {
    setViewMode(mode);
    localStorage.setItem(LOCAL_STORAGE_KEYS.VIEW_MODE, mode);
  };

  // Status options for filter dropdown
  const statusOptions = [
    { value: "all", label: "All Status", count: 0 },
    { value: RESOURCE_STATUS.CRITICAL, label: "Critical", count: 0 },
    { value: RESOURCE_STATUS.BELOW_TARGET, label: "Below Target", count: 0 },
    { value: RESOURCE_STATUS.AT_TARGET, label: "At Target", count: 0 },
    { value: RESOURCE_STATUS.ABOVE_TARGET, label: "Above Target", count: 0 },
  ];

  // Calculate status counts
  const statusCounts = resources.reduce(
    (acc, resource) => {
      const status = calculateResourceStatus(
        resource.quantityHagga + resource.quantityDeepDesert,
        resource.targetQuantity ?? null,
      );
      acc[status] = (acc[status] || 0) + 1;
      acc.all = (acc.all || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Update status options with counts
  statusOptions.forEach((option) => {
    option.count = statusCounts[option.value] || 0;
  });

  // Create category options for filter dropdown
  const categoryOptions = [
    { value: "all", label: "All Categories", count: 0 },
    ...CATEGORY_OPTIONS.map((cat) => ({ value: cat, label: cat, count: 0 })),
  ];

  // Calculate category counts
  const categoryCounts = resources.reduce(
    (acc, resource) => {
      const category = resource.category || UNCATEGORIZED;
      acc[category] = (acc[category] || 0) + 1;
      acc.all = (acc.all || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Update category options with counts
  categoryOptions.forEach((option) => {
    option.count = categoryCounts[option.value] || 0;
  });

  // Calculate needs updating count
  const needsUpdateCount = resources.filter((resource) =>
    needsUpdating(resource.updatedAt, !!resource.isPriority),
  ).length;

  // Fetch recent activity
  const fetchRecentActivity = useCallback(async () => {
    try {
      setActivityLoading(true);
      const response = await fetch(
        `${USER_ACTIVITY_API_PATH}?global=true&limit=50`,
      );
      if (response.ok) {
        const activity = await response.json();
        setRecentActivity(activity);
      }
    } catch (error) {
      console.error("Error fetching recent activity:", error);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  // Calculate top contributors from last week
  const calculateTopContributors = () => {
    const oneWeekAgo = new Date(Date.now() - ONE_WEEK_IN_MS);
    const contributors: { [key: string]: number } = {};

    recentActivity.forEach((activity) => {
      const activityDate = new Date(activity.createdAt);
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
          (contributors[activity.updatedBy] || 0) + activity.changeAmount;
      }
    });

    return Object.entries(contributors)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([user, amount]) => ({ user, amount }));
  };

  // Save view mode to localStorage whenever it changes
  const handleViewModeChange = (
    newViewMode: (typeof VIEW_MODE)[keyof typeof VIEW_MODE],
  ) => {
    setViewMode(newViewMode);
    localStorage.setItem(LOCAL_STORAGE_KEYS.VIEW_MODE, newViewMode);
  };

  // Navigate to resource detail page
  const handleResourceClick = (resourceId: string) => {
    router.push(`/resources/${resourceId}`);
  };

  // Update resource status immediately and track changes
  const updateResourceStatus = (
    resourceId: string,
    quantity: number,
    targetQuantity: number | null,
  ) => {
    const resource = resources.find((r) => r.id === resourceId);
    if (!resource) return;

    const oldStatus = calculateResourceStatus(
      resource.quantityHagga + resource.quantityDeepDesert,
      resource.targetQuantity || null,
    );
    const newStatus = calculateResourceStatus(quantity, targetQuantity);

    if (oldStatus !== newStatus) {
      setStatusChanges((prev) =>
        new Map(prev).set(resourceId, {
          oldStatus,
          newStatus,
          timestamp: Date.now(),
        }),
      );

      // Clear the status change indicator after 3 seconds
      setTimeout(() => {
        setStatusChanges((prev) => {
          const newMap = new Map(prev);
          newMap.delete(resourceId);
          return newMap;
        });
      }, STATUS_CHANGE_TIMEOUT_MS);
    }
  };

  // Fetch resources from API
  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      const timestamp = Date.now();
      const response = await fetch(`${RESOURCES_API_PATH}?t=${timestamp}`);

      if (response.ok) {
        const data = await response.json();
        setResources(
          data.map((resource: any) => ({
            ...resource,
            updatedAt: new Date(resource.updatedAt).toISOString(),
            createdAt: new Date(resource.createdAt).toISOString(),
          })),
        );
      }
    } catch (error) {
      console.error("Error fetching resources:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSaveTargetChange = async (
    resourceId: string,
    newTarget: number,
  ) => {
    if (!isTargetAdmin) return;

    setSaving(true);
    try {
      const response = await fetch(
        `${RESOURCES_API_PATH}/${resourceId}/target`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            targetQuantity: newTarget,
          }),
        },
      );

      if (response.ok) {
        const updatedResource = await response.json();
        setResources((prev) =>
          prev.map((r) =>
            r.id === resourceId ? { ...r, ...updatedResource } : r,
          ),
        );
        setChangeTargetModalState({ isOpen: false, resource: null });
      } else {
        console.error("Failed to save target quantity");
        throw new Error("Failed to save target quantity.");
      }
    } catch (error) {
      console.error("Error saving target quantity:", error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Admin function to start editing a resource
  const startEditResource = (resource: Resource) => {
    if (!isResourceAdmin) return;
    setEditModalState({ isOpen: true, resource: resource });
  };

  // Admin function to save resource metadata changes
  const saveResourceMetadata = async (resourceId: string, formData: any) => {
    if (!isResourceAdmin) return;

    setSaving(true);
    try {
      const response = await fetch(RESOURCES_API_PATH, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resourceMetadata: {
            id: resourceId,
            ...formData,
          },
        }),
      });

      if (response.ok) {
        const updatedResource = await response.json();
        setResources((prev) =>
          prev.map((r) =>
            r.id === resourceId ? { ...r, ...updatedResource } : r,
          ),
        );
        setEditModalState({ isOpen: false, resource: null });
      } else {
        console.error("Failed to update resource metadata");
        throw new Error("Failed to update resource metadata.");
      }
    } catch (error) {
      console.error("Error updating resource metadata:", error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Admin function to create new resource
  const createNewResource = async () => {
    if (!isResourceAdmin) return;

    if (!createResourceForm.name || !createResourceForm.category) {
      alert("Name and category are required");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(RESOURCES_API_PATH, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createResourceForm),
      });

      if (response.ok) {
        const newResource = await response.json();
        setResources((prev) => [...prev, newResource]);
        setShowCreateForm(false);
        setCreateResourceForm({
          name: "",
          category: RAW_CATEGORY,
          description: "",
          imageUrl: "",
          quantityHagga: 0,
          quantityDeepDesert: 0,
          targetQuantity: 0,
          multiplier: 1.0,
        });
      } else {
        console.error("Failed to create resource");
      }
    } catch (error) {
      console.error("Error creating resource:", error);
    } finally {
      setSaving(false);
    }
  };

  // Admin function to delete resource
  const handleTransfer = async (
    resourceId: string,
    amount: number,
    direction: "to_deep_desert" | "to_hagga",
  ) => {
    try {
      const response = await fetch(
        `${RESOURCES_API_PATH}/${resourceId}/transfer`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transferAmount: amount,
            transferDirection: direction,
          }),
        },
      );

      if (response.ok) {
        const { resource } = await response.json();
        setResources((prev) =>
          prev.map((r) => (r.id === resourceId ? { ...r, ...resource } : r)),
        );
      } else {
        const { error } = await response.json();
        throw new Error(error || "Failed to transfer quantity.");
      }
    } catch (error) {
      console.error("Error transferring quantity:", error);
      throw error;
    }
  };

  const handleUpdate = async (
    resourceId: string,
    amount: number,
    quantityField: "quantityHagga" | "quantityDeepDesert",
    updateType: "absolute" | "relative",
    reason?: string,
    onBehalfOf?: string,
  ) => {
    const resource = resources.find((r) => r.id === resourceId);
    if (!resource) return;

    let newQuantity: number;
    if (updateType === UPDATE_TYPE.RELATIVE) {
      newQuantity = Math.max(0, resource[quantityField] + amount);
    } else {
      newQuantity = Math.max(0, amount);
    }

    try {
      const response = await fetch(`${RESOURCES_API_PATH}/${resourceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity: newQuantity,
          updateType: updateType,
          changeValue: amount,
          quantityField: quantityField,
          reason,
          onBehalfOf,
        }),
      });

      if (response.ok) {
        const { resource, pointsEarned, pointsCalculation } =
          await response.json();
        setResources((prev) =>
          prev.map((r) => (r.id === resourceId ? { ...r, ...resource } : r)),
        );

        // Show congratulations popup if points were earned
        if (pointsEarned > 0) {
          setCongratulationsState({
            isVisible: true,
            pointsEarned: pointsEarned,
            pointsCalculation: pointsCalculation,
            resourceName: resource.name,
            actionType:
              updateType === "absolute" ? "SET" : amount > 0 ? "ADD" : "REMOVE",
            quantityChanged: Math.abs(amount),
          });
        }
      } else {
        const { error } = await response.json();
        throw new Error(error || "Failed to update quantity.");
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      throw error;
    }
  };

  const deleteResource = async (resourceId: string) => {
    if (!isResourceAdmin) return;

    setSaving(true);
    try {
      const response = await fetch(`${RESOURCES_API_PATH}/${resourceId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setResources((prev) => prev.filter((r) => r.id !== resourceId));
        setDeleteConfirm({
          resourceId: null,
          resourceName: "",
          showDialog: false,
        });
      } else {
        console.error("Failed to delete resource");
      }
    } catch (error) {
      console.error("Error deleting resource:", error);
    } finally {
      setSaving(false);
    }
  };

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async () => {
    try {
      setLeaderboardLoading(true);
      const response = await fetch(
        `${LEADERBOARD_API_PATH}?timeFilter=${leaderboardTimeFilter}&limit=10`,
      );
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      } else {
        console.error(
          "Leaderboard API error:",
          response.status,
          response.statusText,
        );
        setLeaderboard([]);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      setLeaderboard([]);
    } finally {
      setLeaderboardLoading(false);
    }
  }, [leaderboardTimeFilter]);

  // Fetch resources on component mount
  useEffect(() => {
    fetchResources();
    fetchRecentActivity();
  }, [fetchResources, fetchRecentActivity]);

  // Fetch leaderboard when time filter changes
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Filter resources based on search term and filters
  const filteredResources = resources
    .filter((resource) => {
      const searchLower = searchTerm.toLowerCase();
      const resourceNameLower = resource.name.toLowerCase();

      // Text search filter
      let matchesSearch = true;
      if (searchTerm) {
        // Exact name match (highest priority)
        if (resourceNameLower === searchLower) {
          matchesSearch = true;
        }
        // Partial name match (high priority)
        else if (resourceNameLower.includes(searchLower)) {
          matchesSearch = true;
        }
        // Extended search: only for longer search terms (6+ characters) to avoid broad matches
        else if (searchLower.length >= 6) {
          matchesSearch =
            (resource.description?.toLowerCase().includes(searchLower) ??
              false) ||
            (resource.category?.toLowerCase().includes(searchLower) ?? false);
        } else {
          matchesSearch = false;
        }
      }

      // Status filter
      let matchesStatus = true;
      if (statusFilter !== LEADERBOARD_TIME_FILTERS.ALL) {
        const resourceStatus = calculateResourceStatus(
          resource.quantityHagga + resource.quantityDeepDesert,
          resource.targetQuantity ?? null,
        );
        matchesStatus = resourceStatus === statusFilter;
      }

      // Needs updating filter
      let matchesNeedsUpdate = true;
      if (needsUpdateFilter) {
        matchesNeedsUpdate = needsUpdating(
          resource.updatedAt,
          !!resource.isPriority,
        );
      }

      // Category filter
      let matchesCategory = true;
      if (categoryFilter !== "all") {
        matchesCategory =
          (resource.category || UNCATEGORIZED) === categoryFilter;
      }

      // Priority filter
      let matchesPriority = true;
      if (priorityFilter) {
        matchesPriority = resource.isPriority === true;
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesNeedsUpdate &&
        matchesCategory &&
        matchesPriority
      );
    })
    .sort((a, b) => {
      // If there's a search term, sort by search relevance
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const aNameLower = a.name.toLowerCase();
        const bNameLower = b.name.toLowerCase();

        // Exact name matches first
        const aExact = aNameLower === searchLower;
        const bExact = bNameLower === searchLower;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // Then partial name matches (by position in name)
        const aNameMatch = aNameLower.includes(searchLower);
        const bNameMatch = bNameLower.includes(searchLower);
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;

        // If both are name matches, sort by position of match
        if (aNameMatch && bNameMatch) {
          const aIndex = aNameLower.indexOf(searchLower);
          const bIndex = bNameLower.indexOf(searchLower);
          if (aIndex !== bIndex) return aIndex - bIndex;
        }
      }

      // Default sort by name
      return a.name.localeCompare(b.name);
    });

  // Group resources by category for grid view
  const groupedResources = filteredResources.reduce(
    (acc, resource) => {
      const category = resource.category || UNCATEGORIZED;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(resource);
      return acc;
    },
    {} as Record<string, Resource[]>,
  );

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-text-link"></div>
        <p className="mt-2 text-text-tertiary">Loading resources...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Updates */}
        <div className="rounded-lg border border-border-primary bg-background-panel p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">
              Recent Updates
            </h3>
            <svg
              className="h-5 w-5 text-text-quaternary"
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
            <div className="py-4 text-center">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-text-link"></div>
              <p className="mt-2 text-sm text-text-tertiary">
                Loading updates...
              </p>
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="py-4 text-center text-text-tertiary">
              <p className="text-sm">No recent updates</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className="flex cursor-pointer items-center justify-between rounded-lg bg-button-secondary-neutral-bg p-3 transition-colors hover:bg-button-secondary-neutral-bg-hover"
                  onClick={() => handleResourceClick(activity.resourceId)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        activity.changeAmount > 0
                          ? "bg-activity-positive-bg"
                          : activity.changeAmount < 0
                            ? "bg-activity-negative-bg"
                            : "bg-activity-neutral-bg"
                      }`}
                    ></div>
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        {activity.resourceName}
                      </div>
                      <div className="text-xs text-text-quaternary">
                        By {activity.updatedBy} •{" "}
                        {getRelativeTime(activity.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      activity.changeAmount > 0
                        ? "text-text-success"
                        : activity.changeAmount < 0
                          ? "text-text-danger"
                          : "text-text-tertiary"
                    }`}
                  >
                    {activity.changeAmount > 0 ? "+" : ""}
                    {formatNumber(activity.changeAmount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="rounded-lg border border-border-primary bg-background-panel p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">
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
                className="rounded-sm border border-border-secondary bg-background-panel-inset px-2 py-1 text-xs"
              >
                <option value={LEADERBOARD_TIME_FILTERS["24H"]}>24h</option>
                <option value={LEADERBOARD_TIME_FILTERS["7D"]}>7d</option>
                <option value={LEADERBOARD_TIME_FILTERS["30D"]}>30d</option>
                <option value={LEADERBOARD_TIME_FILTERS.ALL}>All</option>
              </select>
              <svg
                className="h-5 w-5 text-text-quaternary"
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
            <div className="py-4 text-center">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-text-link"></div>
              <p className="mt-2 text-sm text-text-tertiary">
                Loading leaderboard...
              </p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="py-4 text-center text-text-tertiary">
              <p className="text-sm">No contributions in this time period</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard
                .slice(0, leaderboardExpanded ? leaderboard.length : 5)
                .map((entry, index) => (
                  <div
                    key={entry.userId}
                    className="flex cursor-pointer items-center justify-between rounded-lg bg-linear-to-r from-leaderboard-gradient-from to-leaderboard-gradient-to p-3 transition-all hover:bg-linear-to-r hover:from-leaderboard-gradient-from-hover hover:to-leaderboard-gradient-to-hover"
                    onClick={() =>
                      router.push(`/dashboard/contributions/${entry.userId}`)
                    }
                    title={`Click to view ${entry.userId}'s detailed contributions`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          index === 0
                            ? "bg-rank-1-bg text-rank-1-text"
                            : index === 1
                              ? "bg-rank-2-bg text-rank-2-text"
                              : index === 2
                                ? "bg-rank-3-bg text-rank-3-text"
                                : "bg-rank-other-bg text-rank-other-text"
                        }`}
                      >
                        #{index + 1}
                      </div>
                      <div className="text-sm font-medium text-text-primary">
                        {entry.userId}
                      </div>
                      <div className="text-xs text-text-quaternary">
                        ({entry.totalActions} actions)
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-bold text-text-link">
                        {entry.totalPoints.toFixed(1)} pts
                      </div>
                      <svg
                        className="h-4 w-4 text-text-quaternary"
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
                    className="w-full py-2 text-center text-sm text-text-link transition-colors hover:text-text-link-hover"
                  >
                    {leaderboardExpanded
                      ? "Show Less"
                      : `Show All ${leaderboard.length} Contributors`}
                  </button>
                )}

                <button
                  onClick={() => router.push("/dashboard/leaderboard")}
                  className="w-full rounded-lg bg-button-primary-bg px-4 py-2 text-sm font-medium text-text-white transition-colors hover:bg-button-primary-bg-hover"
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
        <div className="rounded-lg border border-border-danger bg-background-danger p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg
                className="h-6 w-6 text-text-danger"
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
              <h3 className="text-lg font-semibold text-text-danger">
                Admin Panel
              </h3>
            </div>
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 rounded-lg bg-button-success-bg px-4 py-2 text-sm font-medium text-text-white transition-colors hover:bg-button-success-bg-hover"
              >
                <svg
                  className="h-4 w-4"
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
            <div className="rounded-lg border border-border-secondary bg-background-panel p-4">
              <h4 className="text-md mb-4 font-medium text-text-primary">
                Create New Resource
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-secondary">
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
                    className="w-full rounded-lg border border-border-secondary bg-background-panel-inset px-3 py-2 text-text-primary"
                    placeholder="Resource name"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-text-secondary">
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
                    className="w-full rounded-lg border border-border-secondary bg-background-panel-inset px-3 py-2 text-text-primary"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-text-secondary">
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
                    className="w-full rounded-lg border border-border-secondary bg-background-panel-inset px-3 py-2 text-text-primary"
                    placeholder="Optional description"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-text-secondary">
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
                    className="w-full rounded-lg border border-border-secondary bg-background-panel-inset px-3 py-2 text-text-primary"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-text-secondary">
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
                    className="w-full rounded-lg border border-border-secondary bg-background-panel-inset px-3 py-2 text-text-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-secondary">
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
                    className="w-full rounded-lg border border-border-secondary bg-background-panel-inset px-3 py-2 text-text-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-text-secondary">
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
                    className="w-full rounded-lg border border-border-secondary bg-background-panel-inset px-3 py-2 text-text-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-text-secondary">
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
                    className="w-full rounded-lg border border-border-secondary bg-background-panel-inset px-3 py-2 text-text-primary"
                    placeholder="1.0"
                  />
                  <p className="mt-1 text-xs text-text-quaternary">
                    Points multiplier for this resource (e.g., 0.1 for
                    low-value, 5.0 for high-value)
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={createNewResource}
                  disabled={
                    saving ||
                    !createResourceForm.name ||
                    !createResourceForm.category
                  }
                  className="rounded-lg bg-button-success-bg px-4 py-2 text-sm font-medium text-text-white transition-colors hover:bg-button-success-bg-hover disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Resource"}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setCreateResourceForm({
                      name: "",
                      category: RAW_CATEGORY,
                      description: "",
                      imageUrl: "",
                      quantityHagga: 0,
                      quantityDeepDesert: 0,
                      targetQuantity: 0,
                      multiplier: 1.0,
                    });
                  }}
                  className="rounded-lg bg-button-neutral-bg px-4 py-2 text-sm font-medium text-text-white transition-colors hover:bg-button-neutral-bg-hover"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search and View Toggle */}
      <div className="rounded-lg border border-border-primary bg-background-panel p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          {/* Search and Filters Row */}
          <div className="flex flex-col flex-wrap items-start justify-between gap-4 sm:flex-row sm:items-center">
            {/* Search Bar */}
            <div className="relative max-w-md flex-1">
              <svg
                className="absolute top-3 left-3 h-4 w-4 text-text-quaternary"
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
                className="w-full rounded-lg border border-border-secondary bg-background-panel-inset py-2 pr-4 pl-10 text-text-primary placeholder-text-quaternary focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* View Toggle Buttons */}
            <div className="flex items-center rounded-lg bg-background-panel-inset p-1">
              <button
                onClick={() => setAndSaveViewMode(VIEW_MODE.TABLE)}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === VIEW_MODE.TABLE
                    ? "bg-button-secondary-neutral-bg-hover text-text-primary shadow-xs"
                    : "text-text-tertiary hover:text-text-primary"
                }`}
              >
                <svg
                  className="h-4 w-4"
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
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === VIEW_MODE.GRID
                    ? "bg-button-secondary-neutral-bg-hover text-text-primary shadow-xs"
                    : "text-text-tertiary hover:text-text-primary"
                }`}
              >
                <svg
                  className="h-4 w-4"
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
          <div className="flex flex-col flex-wrap items-start gap-4 sm:flex-row sm:items-center">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-text-secondary">
                Status:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-border-secondary bg-background-panel-inset px-3 py-1.5 text-sm text-text-primary focus:border-transparent focus:ring-2 focus:ring-blue-500"
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
              <label
                htmlFor="category-filter"
                className="text-sm font-medium text-text-secondary"
              >
                Category:
              </label>
              <select
                id="category-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-border-secondary bg-background-panel-inset px-3 py-1.5 text-sm text-text-primary focus:border-transparent focus:ring-2 focus:ring-blue-500"
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
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-text-secondary">
                <input
                  type="checkbox"
                  checked={needsUpdateFilter}
                  onChange={(e) => setNeedsUpdateFilter(e.target.checked)}
                  className="focus:ring-highlight-border h-4 w-4 rounded-sm border-border-secondary bg-background-tertiary text-text-link focus:ring-2"
                />
                <span>Needs updating ({needsUpdateCount})</span>
                <span
                  className="text-xs text-text-quaternary"
                  title="Priority items are flagged after 24 hours, non-priority after 7 days."
                >
                  (24h/7d)
                </span>
              </label>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-text-secondary">
                <input
                  type="checkbox"
                  checked={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.checked)}
                  className="focus:ring-highlight-border h-4 w-4 rounded-sm border-border-secondary bg-background-tertiary text-text-link focus:ring-2"
                />
                <span>Priority</span>
              </label>
            </div>

            {/* Active Filters Indicator */}
            {(statusFilter !== "all" ||
              needsUpdateFilter ||
              searchTerm ||
              categoryFilter !== "all" ||
              priorityFilter) && (
              <div className="flex items-center gap-2 text-sm text-text-tertiary">
                <span>
                  Showing {filteredResources.length} of {resources.length}{" "}
                  resources
                </span>
                <button
                  onClick={() => {
                    setStatusFilter("all");
                    setNeedsUpdateFilter(false);
                    setSearchTerm("");
                    setCategoryFilter("all");
                    setPriorityFilter(false);
                  }}
                  className="text-text-link hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Helper text & Bulk Actions */}
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-text-quaternary">
            💡 Click any resource to view detailed history and analytics
          </p>
          <BulkActions
            filters={{
              status: statusFilter,
              category: categoryFilter,
              needsUpdate: needsUpdateFilter,
              priority: priorityFilter,
            }}
            searchTerm={searchTerm}
            filteredCount={filteredResources.length}
          />
        </div>
      </div>

      {/* Grid View */}
      {viewMode === VIEW_MODE.GRID && (
        <div className="space-y-8">
          {Object.entries(groupedResources)
            .sort(([categoryA], [categoryB]) => {
              // Define the desired order: Raw → Refined → Components → Other categories
              const order = [RAW_CATEGORY, "Refined", COMPONENTS_CATEGORY];
              const indexA = order.indexOf(categoryA);
              const indexB = order.indexOf(categoryB);

              // If both categories are in the defined order, sort by their position
              if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
              }
              // If only one is in the defined order, prioritize it
              if (indexA !== -1) return -1;
              if (indexB !== -1) return 1;
              // If neither is in the defined order, sort alphabetically
              return categoryA.localeCompare(categoryB);
            })
            .map(([category, categoryResources]) => (
              <div key={category} className="space-y-4">
                <h3 className="border-b border-border-primary pb-2 text-lg font-semibold text-text-primary">
                  {category} ({categoryResources.length})
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {categoryResources.map((resource) => {
                    const status = calculateResourceStatus(
                      resource.quantityHagga + resource.quantityDeepDesert,
                      resource.targetQuantity || null,
                    );
                    const statusChange = statusChanges.get(resource.id);
                    const isOutdated = needsUpdating(
                      resource.updatedAt,
                      !!resource.isPriority,
                    );

                    return (
                      <div
                        key={resource.id}
                        className={`group cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md ${
                          isOutdated
                            ? "border-update-indicator-border ring-1 ring-update-indicator-ring"
                            : "border-border-primary"
                        } ${
                          resource.category === BP_CATEGORY
                            ? "bg-category-bp-bg hover:bg-category-bp-bg-hover"
                            : isOutdated
                              ? "bg-update-indicator-bg hover:bg-update-indicator-bg-hover"
                              : "bg-background-panel hover:bg-button-secondary-neutral-bg"
                        }`}
                        onClick={() => handleResourceClick(resource.id)}
                        title={
                          isOutdated
                            ? `⚠️ Not updated in over ${
                                resource.isPriority ? "24 hours" : "7 days"
                              } - Click to view details`
                            : "Click to view detailed resource information"
                        }
                      >
                        {/* Resource Image */}
                        <div className="relative mb-3 aspect-square">
                          {resource.imageUrl ? (
                            <img
                              src={resource.imageUrl}
                              alt={resource.name}
                              className="h-full w-full rounded-lg object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const fallback =
                                  target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className={`flex h-full w-full items-center justify-center rounded-lg bg-background-tertiary ${
                              resource.imageUrl ? "hidden" : "flex"
                            }`}
                          >
                            <span className="text-xs text-text-quaternary">
                              No Image
                            </span>
                          </div>

                          {/* Click indicator */}
                          <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                            <svg
                              className="h-4 w-4 text-text-link"
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
                          <h4 className="truncate text-sm font-medium text-text-primary transition-colors group-hover:text-text-link">
                            {resource.isPriority && (
                              <span className="text-text-priority">* </span>
                            )}
                            {resource.name}
                          </h4>

                          {/* Status Badge */}
                          <div className="flex items-center justify-between">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(
                                status,
                              )} ${statusChange ? "animate-pulse" : ""}`}
                            >
                              {getStatusText(status)}
                            </span>

                            {/* Multiplier Badge */}
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                resource.multiplier === 0
                                  ? "bg-multiplier-zero-bg text-multiplier-zero-text"
                                  : (resource.multiplier || 1.0) >= 3.0
                                    ? "bg-multiplier-high-bg text-multiplier-high-text"
                                    : (resource.multiplier || 1.0) >= 2.0
                                      ? "bg-multiplier-medium-bg text-multiplier-medium-text"
                                      : (resource.multiplier || 1.0) >= 1.0
                                        ? "bg-multiplier-low-bg text-multiplier-low-text"
                                        : "bg-multiplier-very-low-bg text-multiplier-very-low-text"
                              }`}
                            >
                              {resource.multiplier === 0
                                ? "0x"
                                : (resource.multiplier || 1.0).toFixed(1) + "x"}
                            </span>
                          </div>

                          {/* Quantity Display */}
                          <div className="text-center">
                            <div className="text-sm font-bold text-text-primary">
                              Hagga: {formatNumber(resource.quantityHagga)}
                            </div>
                            <div className="text-sm font-bold text-text-primary">
                              Deep Desert:{" "}
                              {formatNumber(resource.quantityDeepDesert)}
                            </div>
                            <div className="text-xs text-text-quaternary">
                              {resource.targetQuantity
                                ? `Target: ${formatNumber(
                                    resource.targetQuantity,
                                  )}`
                                : "No target set"}
                            </div>
                          </div>

                          {/* Last Updated Info */}
                          <div className="border-t border-background-tertiary pt-2 text-center">
                            <div className="text-xs text-text-quaternary">
                              Updated by{" "}
                              <span className="font-medium text-text-tertiary">
                                {resource.lastUpdatedBy}
                              </span>
                            </div>
                            <div className="flex items-center justify-center gap-1">
                              {isOutdated && (
                                <svg
                                  className="h-3 w-3 text-update-indicator-text"
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
                                className={`cursor-help text-xs decoration-dotted hover:underline ${
                                  isOutdated
                                    ? "font-medium text-update-indicator-text"
                                    : "text-text-quaternary"
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
                                    e.stopPropagation();
                                    setUpdateModalState({
                                      isOpen: true,
                                      resource: resource,
                                      updateType: UPDATE_TYPE.RELATIVE,
                                    });
                                  }}
                                  className="flex-1 rounded-sm bg-button-subtle-blue-bg px-2 py-1 text-xs font-medium text-button-subtle-blue-text transition-colors hover:bg-button-subtle-blue-bg-hover"
                                >
                                  Add/Remove
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setUpdateModalState({
                                      isOpen: true,
                                      resource: resource,
                                      updateType: UPDATE_TYPE.ABSOLUTE,
                                    });
                                  }}
                                  className="flex-1 rounded-sm bg-button-subtle-purple-bg px-2 py-1 text-xs font-medium text-button-subtle-purple-text transition-colors hover:bg-button-subtle-purple-bg-hover"
                                >
                                  Set Qty
                                </button>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTransferModalState({
                                      isOpen: true,
                                      resource: resource,
                                    });
                                  }}
                                  className="flex-1 rounded-sm bg-button-subtle-green-bg px-2 py-1 text-xs font-medium text-button-subtle-green-text transition-colors hover:bg-button-subtle-green-bg-hover"
                                >
                                  Transfer
                                </button>
                                {isTargetAdmin && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setChangeTargetModalState({
                                        isOpen: true,
                                        resource: resource,
                                      });
                                    }}
                                    className="flex-1 rounded-sm bg-button-subtle-orange-bg px-2 py-1 text-xs font-medium text-button-subtle-orange-text transition-colors hover:bg-button-subtle-orange-bg-hover"
                                  >
                                    Set Target
                                  </button>
                                )}
                              </div>

                              {/* Admin buttons */}
                              {isResourceAdmin && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditResource(resource);
                                    }}
                                    className="flex-1 rounded-sm bg-button-subtle-yellow-bg px-2 py-1 text-xs font-medium text-button-subtle-yellow-text transition-colors hover:bg-button-subtle-yellow-bg-hover"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteConfirm({
                                        resourceId: resource.id,
                                        resourceName: resource.name,
                                        showDialog: true,
                                      });
                                    }}
                                    className="flex-1 rounded-sm bg-button-subtle-red-bg px-2 py-1 text-xs font-medium text-button-subtle-red-text transition-colors hover:bg-button-subtle-red-bg-hover"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === VIEW_MODE.TABLE && (
        <div className="overflow-hidden rounded-lg border border-border-primary bg-background-primary shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed divide-y divide-border-primary">
              <thead className="bg-background-secondary">
                <tr>
                  <th className="w-1/4 px-3 py-2 text-left text-xs font-medium tracking-wider text-text-quaternary uppercase">
                    Resource
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium tracking-wider text-text-quaternary uppercase">
                    Category
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium tracking-wider text-text-quaternary uppercase">
                    Multiplier
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium tracking-wider text-text-quaternary uppercase">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium tracking-wider text-text-quaternary uppercase">
                    Quantity
                  </th>
                  {canEdit && (
                    <th className="px-3 py-2 text-left text-xs font-medium tracking-wider text-text-quaternary uppercase">
                      Target
                    </th>
                  )}
                  <th className="w-48 px-3 py-2 text-left text-xs font-medium tracking-wider text-text-quaternary uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary bg-background-panel">
                {filteredResources.map((resource) => {
                  const status = calculateResourceStatus(
                    resource.quantityHagga + resource.quantityDeepDesert,
                    resource.targetQuantity || 0,
                  );
                  const statusChange = statusChanges.get(resource.id);
                  const isOutdated = needsUpdating(
                    resource.updatedAt,
                    !!resource.isPriority,
                  );

                  return (
                    <tr
                      key={resource.id}
                      className={`group cursor-pointer transition-colors ${
                        isOutdated
                          ? "border-l-4 border-l-update-indicator-border"
                          : ""
                      } ${
                        resource.category === BP_CATEGORY
                          ? "bg-category-bp-bg hover:bg-category-bp-bg-hover"
                          : isOutdated
                            ? "bg-update-indicator-bg hover:bg-update-indicator-bg-hover"
                            : "hover:bg-background-secondary"
                      }`}
                      onClick={() => handleResourceClick(resource.id)}
                      title={
                        isOutdated
                          ? `⚠️ Not updated in over ${
                              resource.isPriority ? "24 hours" : "7 days"
                            } - Click to view details`
                          : "Click to view detailed resource information"
                      }
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-center">
                          <div className="h-12 w-12 shrink-0">
                            {resource.imageUrl ? (
                              <img
                                className="h-12 w-12 rounded-lg object-cover"
                                src={resource.imageUrl}
                                alt={resource.name}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                  const fallback =
                                    target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div
                              className={`flex h-12 w-12 items-center justify-center rounded-lg bg-background-tertiary ${
                                resource.imageUrl ? "hidden" : "flex"
                              }`}
                            >
                              <span className="text-xs text-text-quaternary">
                                No image
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium break-words text-text-primary transition-colors group-hover:text-text-link">
                              {resource.isPriority && (
                                <span className="text-priority">* </span>
                              )}
                              {resource.name}
                              <svg
                                className="ml-1 inline h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100"
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
                        <span className="inline-flex rounded-full bg-background-tertiary px-2 py-1 text-xs font-semibold text-text-secondary">
                          {resource.category || UNCATEGORIZED}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            resource.multiplier === 0
                              ? "bg-multiplier-zero-bg text-multiplier-zero-text"
                              : (resource.multiplier || 1.0) >= 3.0
                                ? "bg-multiplier-high-bg text-multiplier-high-text"
                                : (resource.multiplier || 1.0) >= 2.0
                                  ? "bg-multiplier-medium-bg text-multiplier-medium-text"
                                  : (resource.multiplier || 1.0) >= 1.0
                                    ? "bg-multiplier-low-bg text-multiplier-low-text"
                                    : "bg-multiplier-very-low-bg text-multiplier-very-low-text"
                          }`}
                        >
                          {resource.multiplier === 0
                            ? "0x"
                            : (resource.multiplier || 1.0).toFixed(1) + "x"}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusTableColor(
                            status,
                          )} ${statusChange ? "animate-pulse" : ""}`}
                        >
                          {getStatusText(status)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm whitespace-nowrap text-text-primary">
                        Hagga: {formatNumber(resource.quantityHagga)}
                        <br />
                        Deep Desert: {formatNumber(resource.quantityDeepDesert)}
                      </td>
                      {canEdit && (
                        <td className="px-3 py-3 text-sm whitespace-nowrap text-text-primary">
                          {resource.targetQuantity
                            ? formatNumber(resource.targetQuantity)
                            : "No target set"}
                        </td>
                      )}

                      <td
                        className="px-3 py-3 text-sm"
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
                                className="min-w-20 flex-1 rounded-sm bg-button-subtle-blue-bg px-2 py-1 text-xs font-medium text-button-subtle-blue-text transition-colors hover:bg-button-subtle-blue-bg-hover"
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
                                className="min-w-20 flex-1 rounded-sm bg-button-subtle-purple-bg px-2 py-1 text-xs font-medium text-button-subtle-purple-text transition-colors hover:bg-button-subtle-purple-bg-hover"
                              >
                                Set Qty
                              </button>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() =>
                                  setTransferModalState({
                                    isOpen: true,
                                    resource: resource,
                                  })
                                }
                                className="min-w-20 flex-1 rounded-sm bg-button-subtle-green-bg px-2 py-1 text-xs font-medium text-button-subtle-green-text transition-colors hover:bg-button-subtle-green-bg-hover"
                              >
                                Transfer
                              </button>
                              {isTargetAdmin && (
                                <button
                                  onClick={() =>
                                    setChangeTargetModalState({
                                      isOpen: true,
                                      resource: resource,
                                    })
                                  }
                                  className="min-w-20 flex-1 rounded-sm bg-button-subtle-orange-bg px-2 py-1 text-xs font-medium text-button-subtle-orange-text transition-colors hover:bg-button-subtle-orange-bg-hover"
                                >
                                  Set Target
                                </button>
                              )}
                            </div>

                            {/* Admin buttons */}
                            {isResourceAdmin && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => startEditResource(resource)}
                                  className="min-w-20 flex-1 rounded-sm bg-button-subtle-yellow-bg px-2 py-1 text-xs font-medium text-button-subtle-yellow-text transition-colors hover:bg-button-subtle-yellow-bg-hover"
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
                                  className="min-w-20 flex-1 rounded-sm bg-button-subtle-red-bg px-2 py-1 text-xs font-medium text-button-subtle-red-text transition-colors hover:bg-button-subtle-red-bg-hover"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredResources.length === 0 && !loading && (
        <div className="py-12 text-center">
          {searchTerm ? (
            <div>
              <p className="text-text-quaternary">
                No resources found matching &quot;{searchTerm}&quot;
              </p>
              <button
                onClick={() => setSearchTerm("")}
                className="mt-2 text-sm font-medium text-text-link hover:text-text-link-hover"
              >
                Clear search
              </button>
            </div>
          ) : (
            <p className="text-text-quaternary">No resources found</p>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-overlay">
          <div className="mx-4 max-w-md rounded-lg border border-border-primary bg-background-panel p-6">
            <div className="mb-4 flex items-center gap-3">
              <Trash2 className="h-8 w-8 text-text-danger" />
              <h3 className="text-lg font-semibold text-text-primary">
                Delete Resource
              </h3>
            </div>

            <div className="mb-6">
              <p className="mb-2 text-text-secondary">
                Are you sure you want to delete{" "}
                <strong>&quot;{deleteConfirm.resourceName}&quot;</strong>?
              </p>
              <div className="rounded-lg border border-border-danger bg-background-danger p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-text-danger" />
                  <div className="text-sm">
                    <p className="mb-1 font-medium text-text-danger">
                      Warning: This action cannot be undone
                    </p>
                    <p className="text-text-danger">
                      This will permanently delete the resource and{" "}
                      <strong>all its history data</strong>. All tracking
                      records, changes, and analytics for this resource will be
                      lost forever.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  setDeleteConfirm({
                    resourceId: null,
                    resourceName: "",
                    showDialog: false,
                  })
                }
                className="rounded-lg bg-button-secondary-bg px-4 py-2 text-sm font-medium text-button-secondary-text transition-colors hover:bg-button-secondary-bg-hover"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.resourceId) {
                    deleteResource(deleteConfirm.resourceId);
                  }
                }}
                disabled={saving}
                className="rounded-lg bg-button-danger-bg px-4 py-2 text-sm font-medium text-text-white transition-colors hover:bg-button-danger-bg-hover disabled:opacity-50"
              >
                {saving ? "Deleting..." : "Delete Resource"}
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
          session={session}
        />
      )}
      <EditResourceModal
        isOpen={editModalState.isOpen}
        onClose={() => setEditModalState({ isOpen: false, resource: null })}
        onSave={saveResourceMetadata}
        resource={editModalState.resource}
      />
      {changeTargetModalState.isOpen && changeTargetModalState.resource && (
        <ChangeTargetModal
          isOpen={changeTargetModalState.isOpen}
          onClose={() =>
            setChangeTargetModalState({ isOpen: false, resource: null })
          }
          onSave={handleSaveTargetChange}
          resource={changeTargetModalState.resource}
        />
      )}
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
  );
}
