"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ResourceHistoryChart } from "@/app/components/ResourceHistoryChart";
import { CongratulationsPopup } from "@/app/components/CongratulationsPopup";
import LinkifiedText from "@/app/components/LinkifiedText";
import { getUserIdentifier } from "@/lib/auth";
import { UpdateQuantityModal } from "@/app/components/UpdateQuantityModal";
import { ChangeTargetModal } from "@/app/components/ChangeTargetModal";
import { TransferModal } from "@/app/components/TransferModal";
import { EditResourceModal } from "@/app/components/EditResourceModal";
import { UPDATE_TYPE } from "@/lib/constants";
import {
  Plus,
  Baseline,
  ArrowRightLeft,
  Target,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";

const CHART_COLORS = {
  total: "#3b82f6",
  hagga: "#10b981",
  deepDesert: "#f97316",
};

// Utility function to format numbers with commas
const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

// Calculate status based on quantity vs target
const calculateResourceStatus = (
  quantity: number,
  targetQuantity: number | null,
): "at_target" | "below_target" | "critical" => {
  if (!targetQuantity || targetQuantity <= 0) return "at_target";

  const percentage = (quantity / targetQuantity) * 100;
  if (percentage >= 100) return "at_target"; // Green - at or above target
  if (percentage >= 50) return "below_target"; // Orange - below target but not critical
  return "critical"; // Red - very much below target
};

// Format status for display
const formatStatusForDisplay = (status: string): string => {
  switch (status) {
    case "at_target":
      return "At Target";
    case "below_target":
      return "Below Target";
    case "critical":
      return "Critical";
    default:
      return status || "Unknown";
  }
};

// Calculate relative time
const getRelativeTime = (date: string | Date, now = new Date()): string => {
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} month${months === 1 ? "" : "s"} ago`;
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} year${years === 1 ? "" : "s"} ago`;
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
  targetQuantity?: number;
  multiplier?: number;
  lastUpdatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function ResourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [resource, setResource] = useState<Resource | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState(7); // days
  const [editMode, setEditMode] = useState(false);
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [newQuantityInput, setNewQuantityInput] = useState<string>("");
  const [updateType, setUpdateType] = useState<"absolute" | "relative">(
    "absolute",
  );
  const [saving, setSaving] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Congratulations popup state
  const [congratulationsState, setCongratulationsState] = useState({
    isVisible: false,
    finalPoints: 0,
    pointsCalculation: {
      basePoints: 0,
      resourceMultiplier: 1.0,
      statusBonus: 0,
      finalPoints: 0,
    },
    resourceName: "",
    actionType: "ADD" as "ADD" | "SET" | "REMOVE",
    quantityChanged: 0,
  });

  // Modal states
  const [updateModalState, setUpdateModalState] = useState<{
    isOpen: boolean;
    resource: Resource | null;
    updateType: "absolute" | "relative";
  }>({ isOpen: false, resource: null, updateType: "absolute" });

  const [changeTargetModalState, setChangeTargetModalState] = useState<{
    isOpen: boolean;
    resource: Resource | null;
  }>({ isOpen: false, resource: null });

  const [transferModalState, setTransferModalState] = useState<{
    isOpen: boolean;
    resource: Resource | null;
  }>({ isOpen: false, resource: null });

  const [editModalState, setEditModalState] = useState<{
    isOpen: boolean;
    resource: Resource | null;
  }>({ isOpen: false, resource: null });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    resourceId: string | null;
    resourceName: string;
    showDialog: boolean;
  }>({ resourceId: null, resourceName: "", showDialog: false });

  const resourceId = params.id as string;
  const canEdit = session?.user?.permissions?.hasResourceAccess ?? false;
  const canChangeTarget =
    session?.user?.permissions?.hasResourceAdminAccess ?? false;

  // Check if user can delete history entries
  const isResourceAdmin =
    session?.user?.permissions?.hasResourceAdminAccess ?? false;

  // Admin function to start editing a resource
  const startEditResource = (resource: Resource) => {
    if (!isResourceAdmin) return;
    setEditModalState({ isOpen: true, resource: resource });
  };

  // Fetch history data
  const fetchHistory = useCallback(
    async (days: number) => {
      setHistoryLoading(true);
      try {
        const response = await fetch(
          `/api/resources/${resourceId}/history?days=${days}`,
        );
        if (response.ok) {
          const historyData = await response.json();
          setHistory(historyData);
        }
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setHistoryLoading(false);
      }
    },
    [resourceId],
  );

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const response = await fetch("/api/leaderboard?timeFilter=7d&limit=10");
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  // Calculate leaderboard from history (legacy - keeping for fallback)
  const calculateLeaderboard = () => {
    const userStats: Record<
      string,
      {
        contributed: number;
        taken: number;
        netChange: number;
        changeCount: number;
      }
    > = {};

    // Only count relative changes for the leaderboard, not absolute value updates
    history
      .filter((entry) => entry.changeType === "relative") // Only relative changes count toward contributions
      .forEach((entry) => {
        const user = entry.updatedBy;
        if (!userStats[user]) {
          userStats[user] = {
            contributed: 0,
            taken: 0,
            netChange: 0,
            changeCount: 0,
          };
        }

        const totalChange =
          entry.changeAmountHagga + entry.changeAmountDeepDesert;
        if (totalChange > 0) {
          userStats[user].contributed += totalChange;
        } else if (totalChange < 0) {
          userStats[user].taken += Math.abs(totalChange);
        }

        userStats[user].netChange += totalChange;
        userStats[user].changeCount += 1;
      });

    return userStats;
  };

  // Update resource quantity
  const updateResource = async () => {
    if (!resource || !canEdit) return;

    setSaving(true);
    try {
      // Parse the final value from input to ensure we have the latest value
      const inputValue =
        newQuantityInput === "" || newQuantityInput === "-"
          ? 0
          : parseInt(newQuantityInput) || 0;

      const finalQuantity =
        updateType === "relative"
          ? Math.max(0, resource.quantityHagga + inputValue)
          : Math.max(0, inputValue);

      const response = await fetch(`/api/resources/${resourceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity: finalQuantity,
          updateType: updateType,
          changeValue: inputValue,
          reason:
            updateType === "relative"
              ? `${inputValue > 0 ? "+" : ""}${inputValue}`
              : undefined,
        }),
      });

      if (response.ok) {
        const responseData = await response.json();

        // Handle new API response format with points
        const updatedResource = responseData.resource || responseData;

        setResource({
          ...updatedResource,
          // Fix date parsing - only convert if it's not already a string
          updatedAt:
            typeof updatedResource.updatedAt === "string"
              ? updatedResource.updatedAt
              : new Date(updatedResource.updatedAt).toISOString(),
        });

        // Show congratulations popup if points were earned
        if (responseData.pointsEarned && responseData.pointsEarned > 0) {
          setCongratulationsState({
            isVisible: true,
            finalPoints: responseData.pointsEarned,
            pointsCalculation: responseData.pointsCalculation || {
              basePoints: responseData.pointsEarned,
              resourceMultiplier: 1.0,
              statusBonus: 0,
              finalPoints: responseData.pointsEarned,
            },
            resourceName: resource.name,
            actionType: updateType === "relative" ? "ADD" : "SET",
            quantityChanged: Math.abs(inputValue),
          });
        }

        setEditMode(false);
        setNewQuantity(0);
        setNewQuantityInput("");
        // Refresh history and leaderboard to show the new change
        fetchHistory(timeFilter);
        fetchLeaderboard();
      } else {
        const errorData = await response.text();
        console.error("Failed to update resource:", errorData);
        setError("Failed to update resource");
      }
    } catch (error) {
      console.error("Error updating resource:", error);
      setError("Error updating resource: " + (error as Error).message);
    } finally {
      setSaving(false);
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
    if (!resource) return;

    let newQuantity: number;
    if (updateType === "relative") {
      newQuantity = Math.max(0, resource[quantityField] + amount);
    } else {
      newQuantity = Math.max(0, amount);
    }

    try {
      const response = await fetch(`/api/resources/${resourceId}`, {
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
        const {
          resource: updatedResource,
          pointsEarned,
          pointsCalculation,
        } = await response.json();
        setResource(updatedResource);

        // Show congratulations popup if points were earned
        if (pointsEarned > 0) {
          setCongratulationsState({
            isVisible: true,
            finalPoints: pointsEarned,
            pointsCalculation: pointsCalculation,
            resourceName: updatedResource.name,
            actionType:
              updateType === "absolute" ? "SET" : amount > 0 ? "ADD" : "REMOVE",
            quantityChanged: Math.abs(amount),
          });
        }

        // Manually trigger a history and leaderboard refresh
        fetchHistory(timeFilter);
        fetchLeaderboard();
      } else {
        const { error } = await response.json();
        throw new Error(error || "Failed to update quantity.");
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      throw error;
    }
  };

  const handleSaveTargetChange = async (
    resourceId: string,
    newTarget: number,
  ) => {
    if (!isResourceAdmin) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/resources/${resourceId}/target`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetQuantity: newTarget,
        }),
      });

      if (response.ok) {
        const updatedResource = await response.json();
        setResource(updatedResource);
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

  const handleTransfer = async (
    resourceId: string,
    amount: number,
    direction: "to_deep_desert" | "to_hagga",
  ) => {
    try {
      const response = await fetch(`/api/resources/${resourceId}/transfer`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transferAmount: amount,
          transferDirection: direction,
        }),
      });

      if (response.ok) {
        const { resource: updatedResource } = await response.json();
        setResource(updatedResource);
        fetchHistory(timeFilter);
        fetchLeaderboard();
      } else {
        const { error } = await response.json();
        throw new Error(error || "Failed to transfer quantity.");
      }
    } catch (error) {
      console.error("Error transferring quantity:", error);
      throw error;
    }
  };

  // Admin function to save resource metadata changes
  const saveResourceMetadata = async (resourceId: string, formData: any) => {
    if (!isResourceAdmin) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/resources`, {
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
        setResource({ ...resource, ...updatedResource });
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

  // Admin function to delete resource
  const deleteResource = async (resourceId: string) => {
    if (!isResourceAdmin) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/resources/${resourceId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDeleteConfirm({
          resourceId: null,
          resourceName: "",
          showDialog: false,
        });
        router.push("/resources");
      } else {
        console.error("Failed to delete resource");
        alert("Failed to delete resource");
      }
    } catch (error) {
      console.error("Error deleting resource:", error);
      alert("Error deleting resource");
    } finally {
      setSaving(false);
    }
  };

  // Delete history entry
  const deleteHistoryEntry = async (entryId: string) => {
    if (!isResourceAdmin) return;

    const confirmationMessage =
      "Are you sure you want to delete this history entry? This action cannot be undone.";
    if (!confirm(confirmationMessage)) {
      return;
    }

    setSaving(true);
    try {
      // Find the entry being deleted
      const entryToDelete = history.find((h) => h.id === entryId);
      if (!entryToDelete) return;

      // Check if this is the most recent entry (first in history array since it's sorted by date desc)
      const isLatestEntry = history[0]?.id === entryId;

      const response = await fetch(
        `/api/resources/${resourceId}/history/${entryId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        // If this was the most recent entry, we need to revert the resource quantity
        if (isLatestEntry && resource) {
          // Update the resource quantity to the previous quantity from the deleted entry
          const revertedQuantityHagga = entryToDelete.previousQuantityHagga;

          // Update the resource in the backend
          await fetch(`/api/resources/${resourceId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              quantity: revertedQuantityHagga,
              updateType: "absolute",
              value: revertedQuantityHagga,
              reason: `Reverted from deleted entry`,
            }),
          });

          // Update local state
          setResource({
            ...resource,
            quantityHagga: revertedQuantityHagga,
            updatedAt: new Date().toISOString(),
          });
        }

        // Refresh history
        fetchHistory(timeFilter);
        // Refresh leaderboard after history deletion
        fetchLeaderboard();
      } else {
        console.error("Failed to delete history entry");
        alert("Failed to delete history entry. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting history entry:", error);
      alert("Error deleting history entry. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    // Redirect if user is not authenticated
    if (sessionStatus === "unauthenticated") {
      router.push("/");
      return;
    }

    // Don't proceed if session is still loading
    if (sessionStatus === "loading") {
      return;
    }

    // Check for resource access once session is loaded
    if (
      sessionStatus === "authenticated" &&
      (!session || !session.user?.permissions?.hasResourceAccess)
    ) {
      router.push("/");
      return;
    }

    const fetchResource = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/resources`);

        if (response.ok) {
          const resources = await response.json();
          const foundResource = resources.find(
            (r: Resource) => r.id === resourceId,
          );

          if (foundResource) {
            setResource({
              ...foundResource,
              // Fix date parsing - only convert if it's not already a string
              updatedAt:
                typeof foundResource.updatedAt === "string"
                  ? foundResource.updatedAt
                  : new Date(foundResource.updatedAt).toISOString(),
              createdAt:
                typeof foundResource.createdAt === "string"
                  ? foundResource.createdAt
                  : new Date(foundResource.createdAt).toISOString(),
            });
            setNewQuantity(foundResource.quantityHagga); // Initialize edit form
            setNewQuantityInput(foundResource.quantityHagga.toString());
          } else {
            setError("Resource not found");
          }
        } else {
          setError("Failed to fetch resource");
        }
      } catch (error) {
        console.error("Error fetching resource:", error);
        setError("Error loading resource");
      } finally {
        setLoading(false);
      }
    };

    fetchResource();
  }, [resourceId, session, router, sessionStatus]);

  // Fetch history when component mounts or time filter changes
  useEffect(() => {
    if (resourceId && sessionStatus === "authenticated") {
      fetchHistory(timeFilter);
    }
  }, [resourceId, timeFilter, sessionStatus, fetchHistory]);

  // Fetch leaderboard data when component mounts
  useEffect(() => {
    if (resourceId && sessionStatus === "authenticated") {
      fetchLeaderboard();
    }
  }, [resourceId, sessionStatus, fetchLeaderboard]);

  // Scroll selected entry into view
  useEffect(() => {
    if (selectedPointId) {
      const element = document.getElementById(
        `history-entry-${selectedPointId}`,
      );
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [selectedPointId]);

  // Update current time every minute to keep relative times fresh
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  if (loading || sessionStatus === "loading") {
    return (
      <div className="bg-background-primary flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-text-link mx-auto h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="text-text-tertiary mt-4">Loading resource details...</p>
        </div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="bg-background-primary flex min-h-screen items-center justify-center">
        <div className="text-center">
          <svg
            className="text-text-quaternary mx-auto mb-4 h-16 w-16"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h2 className="text-text-primary mb-2 text-2xl font-bold">
            Resource Not Found
          </h2>
          <p className="text-text-tertiary mb-6">
            The resource you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have permission to view it.
            {!canEdit && (
              <>
                <br />
                <span className="text-sm">
                  Please make sure you have the required Discord roles.
                </span>
              </>
            )}
          </p>
          <button
            onClick={() => router.push("/resources")}
            className="bg-button-primary-bg hover:bg-button-primary-bg-hover text-text-white rounded-lg px-4 py-2 transition-colors"
          >
            Back to Resources
          </button>
        </div>
      </div>
    );
  }

  const status = calculateResourceStatus(
    resource.quantityHagga + resource.quantityDeepDesert,
    resource.targetQuantity || null,
  );
  const percentage = resource.targetQuantity
    ? Math.round(
        ((resource.quantityHagga + resource.quantityDeepDesert) /
          resource.targetQuantity) *
          100,
      )
    : null;

  return (
    <div className="bg-background-primary min-h-screen transition-colors duration-300">
      {/* Header */}
      <div className="bg-background-secondary border-border-primary border-b shadow-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative flex h-16 items-center justify-center">
            <button
              onClick={() => router.push("/resources")}
              className="text-text-tertiary hover:text-text-primary absolute left-0 flex items-center transition-colors"
            >
              <svg
                className="h-5 w-5 md:mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="hidden md:inline">Back to Resources</span>
            </button>
            <h1 className="text-text-primary text-center text-xl font-semibold">
              Resource Details
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Resource Info Card - Full Width Horizontal Layout */}
          <div className="w-full">
            <div className="bg-tile-background border-border-primary rounded-lg border p-6 shadow-md">
              <div className="flex flex-col gap-6 md:flex-row">
                {/* Resource Image */}
                <div className="shrink-0">
                  {resource.imageUrl ? (
                    <img
                      src={resource.imageUrl}
                      alt={resource.name}
                      className="border-border-secondary mx-auto h-32 w-32 rounded-lg border object-cover md:mx-0"
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
                    className={`bg-background-tertiary mx-auto flex h-32 w-32 items-center justify-center rounded-lg md:mx-0 ${resource.imageUrl ? "hidden" : "flex"}`}
                  >
                    <span className="text-text-quaternary text-sm">
                      No Image
                    </span>
                  </div>
                </div>

                {/* Resource Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="text-center md:text-left">
                      {/* Resource Name */}
                      <h2 className="text-text-primary mb-2 text-2xl font-bold">
                        {resource.name}
                      </h2>

                      {/* Category and Status */}
                      <div className="mb-2 flex flex-wrap justify-center gap-2 md:justify-start">
                        {resource.category && (
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                              resource.category === "Raw"
                                ? "bg-category-raw-bg text-category-raw-text"
                                : resource.category === "Refined"
                                  ? "bg-category-refined-bg text-category-refined-text"
                                  : resource.category === "Components"
                                    ? "bg-category-components-bg text-category-components-text"
                                    : resource.category === "Blueprints"
                                      ? "bg-category-bp-bg"
                                      : "bg-category-other-bg text-category-other-text"
                            }`}
                          >
                            {resource.category}
                          </span>
                        )}
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                            status === "at_target"
                              ? "bg-status-at-target-bg text-status-at-target-text"
                              : status === "below_target"
                                ? "bg-status-below-target-bg text-status-below-target-text"
                                : "bg-status-critical-bg text-status-critical-text"
                          }`}
                        >
                          {formatStatusForDisplay(status)}
                        </span>
                      </div>

                      {/* Description */}
                      {resource.description && (
                        <p className="text-text-tertiary text-center md:text-left">
                          <LinkifiedText text={resource.description} />
                        </p>
                      )}
                    </div>

                    {/* Quantities */}
                    <div className="flex flex-col gap-6 text-center sm:flex-row">
                      <div>
                        <div className="text-text-primary text-xl font-bold">
                          Hagga: {formatNumber(resource.quantityHagga)}
                        </div>
                        <div className="text-text-primary text-xl font-bold">
                          Deep Desert:{" "}
                          {formatNumber(resource.quantityDeepDesert)}
                        </div>
                        <div className="text-text-tertiary text-sm">
                          Current Quantities
                        </div>
                      </div>
                      <div>
                        <div className="text-text-primary text-3xl font-bold">
                          {resource.targetQuantity
                            ? formatNumber(resource.targetQuantity)
                            : "N/A"}
                        </div>
                        <div className="text-text-tertiary text-sm">
                          Target Quantity
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {percentage !== null && (
                    <div>
                      <div className="text-text-tertiary mb-2 flex justify-between text-sm">
                        <span>Progress to Target</span>
                        <span>{percentage}%</span>
                      </div>
                      <div className="bg-background-tertiary h-3 w-full rounded-full">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${
                            percentage >= 100
                              ? "bg-progress-bar-at-target-bg"
                              : percentage >= 50
                                ? "bg-progress-bar-below-target-bg"
                                : "bg-progress-bar-critical-bg"
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Last Updated & Actions */}
                  <div className="border-border-primary flex flex-col gap-4 border-t pt-4 md:flex-row md:items-center md:justify-between">
                    <div className="text-text-tertiary text-center text-sm md:text-left">
                      <div>
                        Last updated by:{" "}
                        <span className="text-text-primary font-medium">
                          {resource.lastUpdatedBy}
                        </span>
                      </div>
                      <div
                        className="cursor-help decoration-dotted hover:underline"
                        title={new Date(resource.updatedAt).toLocaleString()}
                      >
                        {getRelativeTime(resource.updatedAt, currentTime)}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {canEdit && (
                      <div className="w-full md:w-auto">
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() =>
                              setUpdateModalState({
                                isOpen: true,
                                resource,
                                updateType: "relative",
                              })
                            }
                            className="bg-button-subtle-blue-bg hover:bg-button-subtle-blue-bg-hover text-button-subtle-blue-text flex w-full items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                            title="Add or remove from current quantity"
                          >
                            <Plus className="hidden h-4 w-4 md:inline-block" />
                            Add/Remove
                          </button>
                          <button
                            onClick={() =>
                              setUpdateModalState({
                                isOpen: true,
                                resource,
                                updateType: "absolute",
                              })
                            }
                            className="bg-button-subtle-purple-bg hover:bg-button-subtle-purple-bg-hover text-button-subtle-purple-text flex w-full items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                            title="Set a new absolute quantity"
                          >
                            <Baseline className="hidden h-4 w-4 md:inline-block" />
                            Set Qty
                          </button>
                          <button
                            onClick={() =>
                              setTransferModalState({ isOpen: true, resource })
                            }
                            className="bg-button-subtle-green-bg hover:bg-button-subtle-green-bg-hover text-button-subtle-green-text flex w-full items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                            title="Transfer quantities between Hagga and Deep Desert"
                          >
                            <ArrowRightLeft className="hidden h-4 w-4 md:inline-block" />
                            Transfer
                          </button>
                          {isResourceAdmin && (
                            <>
                              <button
                                onClick={() =>
                                  setChangeTargetModalState({
                                    isOpen: true,
                                    resource,
                                  })
                                }
                                className="bg-button-subtle-orange-bg hover:bg-button-subtle-orange-bg-hover text-button-subtle-orange-text flex w-full items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                                title="Change the target quantity for this resource"
                              >
                                <Target className="hidden h-4 w-4 md:inline-block" />
                                Set Target
                              </button>
                              <button
                                onClick={() => startEditResource(resource)}
                                className="bg-button-subtle-yellow-bg hover:bg-button-subtle-yellow-bg-hover text-button-subtle-yellow-text flex w-full items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                                title="Edit resource metadata"
                              >
                                <Pencil className="hidden h-4 w-4 md:inline-block" />
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
                                className="bg-button-subtle-red-bg hover:bg-button-subtle-red-bg-hover text-button-subtle-red-text flex w-full items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                                title="Delete this resource"
                              >
                                <Trash2 className="hidden h-4 w-4 md:inline-block" />
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Mode Modal/Overlay */}
          {editMode && canEdit && (
            <div className="bg-background-overlay fixed inset-0 z-50 flex items-center justify-center">
              <div className="bg-tile-background mx-4 w-full max-w-md rounded-lg p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-text-primary text-lg font-semibold">
                    Update Quantity
                  </h3>
                  <button
                    onClick={() => setEditMode(false)}
                    className="text-text-quaternary hover:text-text-tertiary"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Update Type Toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const newType =
                          updateType === "absolute" ? "relative" : "absolute";
                        setUpdateType(newType);
                        if (newType === "relative") {
                          setNewQuantity(0);
                          setNewQuantityInput("0");
                        } else {
                          setNewQuantity(resource.quantityHagga);
                          setNewQuantityInput(
                            resource.quantityHagga.toString(),
                          );
                        }
                      }}
                      className={`rounded-sm px-3 py-1 text-sm font-medium ${
                        updateType === "relative"
                          ? "bg-button-subtle-blue-bg text-button-subtle-blue-text"
                          : "bg-button-subtle-gray-bg text-button-subtle-gray-text"
                      }`}
                    >
                      {updateType === "relative" ? "+/-" : "="}
                    </button>
                    <span className="text-text-tertiary text-sm">
                      {updateType === "relative"
                        ? "Relative Change"
                        : "Absolute Value"}
                    </span>
                  </div>

                  {/* Quantity Input */}
                  <div>
                    <input
                      type="number"
                      value={newQuantityInput}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || value === "-") {
                          setNewQuantityInput(value);
                          setNewQuantity(0);
                        } else {
                          const parsed = parseInt(value);
                          setNewQuantityInput(value);
                          setNewQuantity(isNaN(parsed) ? 0 : parsed);
                        }
                      }}
                      placeholder={
                        updateType === "relative" ? "±0" : "New quantity"
                      }
                      className="w-full rounded-lg border px-3 py-2 text-right"
                      min={updateType === "absolute" ? "0" : undefined}
                    />
                    {updateType === "relative" && (
                      <div className="text-text-quaternary mt-1 text-xs">
                        New quantity:{" "}
                        {formatNumber(
                          Math.max(0, resource.quantityHagga + newQuantity),
                        )}
                      </div>
                    )}
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={updateResource}
                    disabled={saving}
                    className="bg-button-primary-bg hover:bg-button-primary-bg-hover text-text-white w-full rounded-lg py-2 font-medium disabled:opacity-50"
                  >
                    {saving ? "Updating..." : "Update Quantity"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* History and Leaderboard Section - Full Width */}
        <div className="mt-8 w-full space-y-8">
          {/* Activity Timeline with Chart */}
          <div className="bg-tile-background border-border-primary rounded-lg border p-6 shadow-md">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-text-primary text-lg font-semibold">
                Activity Timeline
              </h3>
              <div className="flex items-center gap-4">
                <span className="text-text-tertiary text-sm">Time Range:</span>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(parseInt(e.target.value))}
                  className="border-border-secondary bg-background-primary text-text-primary rounded-sm border px-3 py-1 text-sm"
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
              <div className="bg-background-modal-content-inset border-border-secondary mb-6 rounded-lg border p-4">
                <h4 className="text-md text-text-secondary mb-4 font-medium">
                  Quantity Over Time
                </h4>
                <div className="relative h-72">
                  <svg
                    className="h-full w-full"
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setMousePosition({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                      });
                    }}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    {/* Chart Lines and Points */}
                    {(() => {
                      const reversedHistory = history.slice().reverse();

                      const { minQuantity, maxQuantity } = history.reduce(
                        (acc, h) => {
                          const total =
                            h.newQuantityHagga + h.newQuantityDeepDesert;
                          acc.minQuantity = Math.min(
                            acc.minQuantity,
                            h.newQuantityHagga,
                            h.newQuantityDeepDesert,
                            total,
                          );
                          acc.maxQuantity = Math.max(
                            acc.maxQuantity,
                            h.newQuantityHagga,
                            h.newQuantityDeepDesert,
                            total,
                          );
                          return acc;
                        },
                        { minQuantity: Infinity, maxQuantity: -Infinity },
                      );

                      const range =
                        maxQuantity !== -Infinity && minQuantity !== Infinity
                          ? maxQuantity - minQuantity || 1
                          : 1;

                      return (
                        <>
                          {/* Lines */}
                          {reversedHistory.map((entry, index, arr) => {
                            if (index === arr.length - 1) return null;
                            const nextEntry = arr[index + 1];

                            const x1 =
                              10 + (index / Math.max(arr.length - 1, 1)) * 80;
                            const x2 =
                              10 +
                              ((index + 1) / Math.max(arr.length - 1, 1)) * 80;

                            const y1_total =
                              80 -
                              ((entry.newQuantityHagga +
                                entry.newQuantityDeepDesert -
                                minQuantity) /
                                range) *
                                60;
                            const y2_total =
                              80 -
                              ((nextEntry.newQuantityHagga +
                                nextEntry.newQuantityDeepDesert -
                                minQuantity) /
                                range) *
                                60;
                            const y1_hagga =
                              80 -
                              ((entry.newQuantityHagga - minQuantity) / range) *
                                60;
                            const y2_hagga =
                              80 -
                              ((nextEntry.newQuantityHagga - minQuantity) /
                                range) *
                                60;
                            const y1_deep_desert =
                              80 -
                              ((entry.newQuantityDeepDesert - minQuantity) /
                                range) *
                                60;
                            const y2_deep_desert =
                              80 -
                              ((nextEntry.newQuantityDeepDesert - minQuantity) /
                                range) *
                                60;

                            return (
                              <g key={`line-${entry.id}`}>
                                <line
                                  x1={`${x1}%`}
                                  y1={`${y1_total}%`}
                                  x2={`${x2}%`}
                                  y2={`${y2_total}%`}
                                  stroke={CHART_COLORS.total}
                                  strokeWidth="2"
                                />
                                <line
                                  x1={`${x1}%`}
                                  y1={`${y1_hagga}%`}
                                  x2={`${x2}%`}
                                  y2={`${y2_hagga}%`}
                                  stroke={CHART_COLORS.hagga}
                                  strokeWidth="2"
                                />
                                <line
                                  x1={`${x1}%`}
                                  y1={`${y1_deep_desert}%`}
                                  x2={`${x2}%`}
                                  y2={`${y2_deep_desert}%`}
                                  stroke={CHART_COLORS.deepDesert}
                                  strokeWidth="2"
                                />
                              </g>
                            );
                          })}
                          {/* Points */}
                          {reversedHistory.map((entry, index, arr) => {
                            const x =
                              10 + (index / Math.max(arr.length - 1, 1)) * 80;
                            const y_total =
                              80 -
                              ((entry.newQuantityHagga +
                                entry.newQuantityDeepDesert -
                                minQuantity) /
                                range) *
                                60;
                            const y_hagga =
                              80 -
                              ((entry.newQuantityHagga - minQuantity) / range) *
                                60;
                            const y_deep_desert =
                              80 -
                              ((entry.newQuantityDeepDesert - minQuantity) /
                                range) *
                                60;

                            const isSelected = selectedPointId === entry.id;
                            const isHovered = hoveredPoint?.id === entry.id;
                            const pointRadius = isSelected
                              ? "6"
                              : isHovered
                                ? "5"
                                : "4";

                            return (
                              <g
                                key={`point-group-${entry.id}`}
                                onMouseEnter={() => setHoveredPoint(entry)}
                                onMouseLeave={() => setHoveredPoint(null)}
                                onClick={() =>
                                  setSelectedPointId(
                                    selectedPointId === entry.id
                                      ? null
                                      : entry.id,
                                  )
                                }
                                className="cursor-pointer"
                              >
                                <circle
                                  cx={`${x}%`}
                                  cy={`${y_total}%`}
                                  r={pointRadius}
                                  fill={CHART_COLORS.total}
                                  stroke={
                                    isSelected ? CHART_COLORS.total : "white"
                                  }
                                  strokeWidth="2"
                                />
                                <circle
                                  cx={`${x}%`}
                                  cy={`${y_hagga}%`}
                                  r={pointRadius}
                                  fill={CHART_COLORS.hagga}
                                  stroke={
                                    isSelected ? CHART_COLORS.hagga : "white"
                                  }
                                  strokeWidth="2"
                                />
                                <circle
                                  cx={`${x}%`}
                                  cy={`${y_deep_desert}%`}
                                  r={pointRadius}
                                  fill={CHART_COLORS.deepDesert}
                                  stroke={
                                    isSelected
                                      ? CHART_COLORS.deepDesert
                                      : "white"
                                  }
                                  strokeWidth="2"
                                />
                              </g>
                            );
                          })}
                          {/* Y-axis labels */}
                          {Array.from({ length: 4 }).map((_, i) => {
                            const numLabels = 4;
                            const value =
                              minQuantity + (range / (numLabels - 1)) * i;
                            const y = 80 - ((value - minQuantity) / range) * 60;
                            return (
                              <text
                                key={i}
                                x="0"
                                y={`${y}%`}
                                dominant-baseline="middle"
                                fontSize="10"
                                fill="#6b7280"
                                className="text-xs"
                                textAnchor="start"
                              >
                                {formatNumber(Math.round(value))}
                              </text>
                            );
                          })}
                        </>
                      );
                    })()}

                    {/* X-axis time labels */}
                    {history.length > 1 &&
                      history
                        .slice()
                        .reverse()
                        .map((entry, index, arr) => {
                          if (
                            index % Math.max(1, Math.floor(arr.length / 4)) !==
                              0 &&
                            index !== arr.length - 1
                          )
                            return null;

                          const x =
                            10 + (index / Math.max(arr.length - 1, 1)) * 80;
                          const date = new Date(entry.createdAt);
                          const timeLabel =
                            date.toLocaleDateString() ===
                            new Date().toLocaleDateString()
                              ? date.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : date.toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                });

                          const isHovered = hoveredPoint?.id === entry.id;
                          const isSelected = selectedPointId === entry.id;

                          return (
                            <text
                              key={`time-${entry.id}`}
                              x={`${x}%`}
                              y="98%"
                              fontSize="9"
                              fill="#6b7280"
                              fontWeight={
                                isHovered || isSelected ? "bold" : "normal"
                              }
                              className="text-xs transition-all"
                              textAnchor="middle"
                            >
                              {timeLabel}
                            </text>
                          );
                        })}
                  </svg>

                  {/* Hover Tooltip */}
                  {hoveredPoint && (
                    <div
                      className="bg-background-tooltip text-text-tooltip pointer-events-none absolute z-10 rounded-sm px-2 py-1 text-xs whitespace-nowrap"
                      style={{
                        left: mousePosition.x + 10,
                        top: mousePosition.y - 10,
                        transform:
                          mousePosition.x > 200 ? "translateX(-100%)" : "none",
                      }}
                    >
                      <div className="font-medium">
                        {formatNumber(
                          hoveredPoint.newQuantityHagga +
                            hoveredPoint.newQuantityDeepDesert,
                        )}
                      </div>
                      <div className="text-text-tooltip-secondary">
                        {hoveredPoint.changeAmountHagga +
                          hoveredPoint.changeAmountDeepDesert >
                        0
                          ? "+"
                          : ""}
                        {formatNumber(
                          hoveredPoint.changeAmountHagga +
                            hoveredPoint.changeAmountDeepDesert,
                        )}
                      </div>
                      <div className="text-text-tooltip-secondary">
                        By: {hoveredPoint.updatedBy}
                      </div>
                      <div className="text-text-tooltip-secondary">
                        {getRelativeTime(hoveredPoint.createdAt, currentTime)}
                      </div>
                      <div className="text-text-tooltip-accent mt-1 text-center">
                        Click to highlight
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-text-tertiary mt-4 flex items-center justify-center gap-6 text-xs">
                  <div className="flex items-center gap-1">
                    <div
                      className="h-3 w-3 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: CHART_COLORS.total }}
                    ></div>
                    <span>Total</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div
                      className="h-3 w-3 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: CHART_COLORS.hagga }}
                    ></div>
                    <span>Hagga</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div
                      className="h-3 w-3 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: CHART_COLORS.deepDesert }}
                    ></div>
                    <span>Deep Desert</span>
                  </div>
                  <div className="text-text-quaternary ml-4">
                    💡 Hover points for details, click to highlight below •
                    Times update automatically
                  </div>
                </div>
              </div>
            )}

            {!historyLoading && history.length <= 1 && (
              <div className="text-text-quaternary py-8 text-center">
                <svg
                  className="text-text-quaternary mx-auto mb-4 h-12 w-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <p>Not enough data points for chart</p>
                <p className="text-sm">At least 2 history entries needed</p>
              </div>
            )}
          </div>

          {/* Resource-Specific Contribution Leaderboard */}
          <div className="bg-tile-background border-border-primary rounded-lg border p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-text-primary text-lg font-semibold">
                Contribution Leaderboard
              </h3>
              <div className="text-text-quaternary bg-background-tertiary rounded-sm px-2 py-1 text-xs">
                Only +/- changes count
              </div>
            </div>
            <div className="text-text-tertiary mb-6 text-sm">
              Tracks contributions and consumption from relative changes (+500,
              -200, etc.) for this resource. Administrative value updates are
              not included.
            </div>

            {historyLoading ? (
              <div className="py-4 text-center">
                <div className="border-text-link mx-auto h-6 w-6 animate-spin rounded-full border-b-2"></div>
              </div>
            ) : history.length === 0 ? (
              <div className="text-text-quaternary py-4 text-center">
                No activity in the selected time period
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Top Contributors */}
                <div>
                  <h4 className="text-md text-text-success mb-3 font-medium">
                    🏆 Top Contributors
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(calculateLeaderboard())
                      .filter(([_, stats]) => stats.contributed > 0)
                      .sort((a, b) => b[1].contributed - a[1].contributed)
                      .slice(0, 5)
                      .map(([user, stats], index) => (
                        <div
                          key={user}
                          className="bg-background-success flex items-center justify-between rounded-sm p-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-text-primary text-sm font-medium">
                              #{index + 1}
                            </span>
                            <span className="text-text-primary text-sm">
                              {user}
                            </span>
                          </div>
                          <span className="text-text-success text-sm font-medium">
                            +{formatNumber(stats.contributed)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Top Consumers */}
                <div>
                  <h4 className="text-md text-text-danger mb-3 font-medium">
                    📉 Top Consumers
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(calculateLeaderboard())
                      .filter(([_, stats]) => stats.taken > 0)
                      .sort((a, b) => b[1].taken - a[1].taken)
                      .slice(0, 5)
                      .map(([user, stats], index) => (
                        <div
                          key={user}
                          className="bg-background-danger flex items-center justify-between rounded-sm p-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-text-primary text-sm font-medium">
                              #{index + 1}
                            </span>
                            <span className="text-text-primary text-sm">
                              {user}
                            </span>
                          </div>
                          <span className="text-text-danger text-sm font-medium">
                            -{formatNumber(stats.taken)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Global Points Leaderboard */}
          <div className="bg-tile-background border-border-primary rounded-lg border p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-text-primary text-lg font-semibold">
                🏆 Points Leaderboard
              </h3>
              <div className="text-text-quaternary bg-background-tertiary rounded-sm px-2 py-1 text-xs">
                Global rankings (last 7 days)
              </div>
            </div>
            <div className="text-text-tertiary mb-6 text-sm">
              Rankings based on points earned from resource contributions across
              all resources.
            </div>

            {leaderboardLoading ? (
              <div className="py-4 text-center">
                <div className="border-text-link mx-auto h-6 w-6 animate-spin rounded-full border-b-2"></div>
                <p className="text-text-tertiary mt-2 text-sm">
                  Loading leaderboard...
                </p>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-text-tertiary py-4 text-center">
                <p className="text-sm">
                  No contributions in the selected time period
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.slice(0, 10).map((entry, index) => (
                  <div
                    key={entry.userId}
                    className="from-leaderboard-gradient-from to-leaderboard-gradient-to hover:from-leaderboard-gradient-from-hover hover:to-leaderboard-gradient-to-hover flex cursor-pointer items-center justify-between rounded-lg bg-linear-to-r p-3 transition-all hover:bg-linear-to-r"
                    onClick={() =>
                      router.push(`/dashboard/contributions/${entry.userId}`)
                    }
                    title={`Click to view ${entry.userId}&apos;s detailed contributions`}
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
                      <div className="text-text-primary text-sm font-medium">
                        {entry.userId}
                      </div>
                      <div className="text-text-quaternary text-xs">
                        ({entry.totalActions} actions)
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-text-link text-sm font-bold">
                        {entry.totalPoints.toFixed(1)} pts
                      </div>
                      <svg
                        className="text-text-quaternary h-4 w-4"
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

                <div className="border-border-primary border-t pt-4">
                  <button
                    onClick={() => router.push("/dashboard/leaderboard")}
                    className="bg-button-primary-bg hover:bg-button-primary-bg-hover text-text-white w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                  >
                    View Full Leaderboard
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* History Timeline */}
          <div className="bg-tile-background border-border-primary rounded-lg border p-6 shadow-md">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-text-primary text-lg font-semibold">
                Recent Changes
              </h3>
              <div className="flex items-center gap-3">
                {selectedPointId && (
                  <div className="text-text-tertiary bg-background-tertiary rounded-sm px-2 py-1 text-sm">
                    Point selected on chart
                  </div>
                )}
                {selectedPointId && (
                  <button
                    onClick={() => setSelectedPointId(null)}
                    className="bg-button-subtle-blue-bg hover:bg-button-subtle-blue-bg-hover text-button-subtle-blue-text rounded-lg px-3 py-1 text-sm transition-colors"
                  >
                    Clear Selection
                  </button>
                )}
              </div>
            </div>

            {historyLoading ? (
              <div className="py-8 text-center">
                <div className="border-text-link mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
                <p className="text-text-tertiary mt-2">Loading history...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="text-text-quaternary py-8 text-center">
                <svg
                  className="text-text-quaternary mx-auto mb-4 h-12 w-12"
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
                <p>
                  No changes in the last {timeFilter}{" "}
                  {timeFilter === 1 ? "day" : "days"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((entry, index) => {
                  const isHighlighted = selectedPointId === entry.id;

                  return (
                    <div
                      key={entry.id}
                      id={`history-entry-${entry.id}`}
                      className={`group flex cursor-pointer items-start justify-between rounded-lg p-4 transition-all duration-300 ${
                        isHighlighted
                          ? "bg-background-highlight border-border-highlight scale-[1.02] transform border-2 shadow-md"
                          : "bg-button-secondary-neutral-bg hover:bg-button-secondary-neutral-bg-hover"
                      }`}
                      onClick={() =>
                        setSelectedPointId(
                          selectedPointId === entry.id ? null : entry.id,
                        )
                      }
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-4">
                        <div
                          className={`mt-1.5 h-3 w-3 flex-shrink-0 rounded-full ${
                            entry.changeAmountHagga +
                              entry.changeAmountDeepDesert >
                            0
                              ? "bg-activity-positive-bg"
                              : entry.changeAmountHagga +
                                    entry.changeAmountDeepDesert <
                                  0
                                ? "bg-activity-negative-bg"
                                : "bg-activity-neutral-bg"
                          } ${isHighlighted ? "ring-highlight-border ring-2" : ""}`}
                        ></div>
                        <div className="min-w-0 flex-1">
                          <div className="text-text-primary flex flex-wrap items-center gap-2 font-medium">
                            {entry.changeType === "transfer" ? (
                              <span>
                                Transfer {entry.transferAmount}{" "}
                                {entry.transferDirection === "to_deep_desert"
                                  ? "to Deep Desert"
                                  : "to Hagga"}
                              </span>
                            ) : (
                              <div className="flex flex-col">
                                <div>
                                  Hagga:{" "}
                                  {formatNumber(entry.previousQuantityHagga)} →{" "}
                                  {formatNumber(entry.newQuantityHagga)} (
                                  {entry.changeAmountHagga > 0 ? "+" : ""}
                                  {formatNumber(entry.changeAmountHagga)})
                                </div>
                                <div>
                                  Deep Desert:{" "}
                                  {formatNumber(
                                    entry.previousQuantityDeepDesert,
                                  )}{" "}
                                  → {formatNumber(entry.newQuantityDeepDesert)}{" "}
                                  ({entry.changeAmountDeepDesert > 0 ? "+" : ""}
                                  {formatNumber(entry.changeAmountDeepDesert)})
                                </div>
                              </div>
                            )}
                            {/* Change Type Indicator */}
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs ${
                                entry.changeType === "relative"
                                  ? "bg-button-subtle-blue-bg text-button-subtle-blue-text"
                                  : entry.changeType === "transfer"
                                    ? "bg-button-subtle-yellow-bg text-button-subtle-yellow-text"
                                    : "bg-tag-neutral-bg text-tag-neutral-text"
                              }`}
                            >
                              {entry.changeType}
                            </span>
                            {isHighlighted && (
                              <span className="bg-tag-selected-bg text-tag-selected-text animate-pulse rounded-full px-2 py-0.5 text-xs">
                                Selected
                              </span>
                            )}
                          </div>
                          <div className="text-text-tertiary mt-1 text-sm">
                            By{" "}
                            <span className="font-medium">
                              {entry.updatedBy}
                            </span>
                            {entry.changeType === "relative" && (
                              <span className="text-text-success ml-2 text-xs">
                                • Counts toward leaderboard
                              </span>
                            )}
                          </div>
                          {entry.reason && (
                            <div className="text-text-secondary bg-background-tertiary mt-2 rounded-md p-2 text-sm break-words whitespace-pre-wrap">
                              <LinkifiedText text={entry.reason} />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start gap-3 pl-4">
                        <div className="text-text-quaternary flex-shrink-0 text-right text-sm">
                          <div
                            className="cursor-help decoration-dotted hover:underline"
                            title={`${new Date(entry.createdAt).toLocaleDateString()} at ${new Date(entry.createdAt).toLocaleTimeString()}`}
                          >
                            {getRelativeTime(entry.createdAt, currentTime)}
                          </div>
                          {isHighlighted && (
                            <div className="text-text-link mt-1 text-xs">
                              📍 Chart point
                            </div>
                          )}
                        </div>

                        {/* Delete button for admin users */}
                        {isResourceAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteHistoryEntry(entry.id);
                            }}
                            disabled={saving}
                            className="text-button-icon-danger-text hover:text-button-icon-danger-text-hover hover:bg-button-icon-danger-bg-hover rounded-sm p-1 opacity-0 transition-opacity group-hover:opacity-100"
                            title="Delete this history entry"
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
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
          onClose={() =>
            setCongratulationsState({
              ...congratulationsState,
              isVisible: false,
            })
          }
          pointsEarned={congratulationsState.finalPoints}
          pointsCalculation={congratulationsState.pointsCalculation}
          resourceName={congratulationsState.resourceName}
          actionType={congratulationsState.actionType}
          quantityChanged={congratulationsState.quantityChanged}
          userId={session ? getUserIdentifier(session) : undefined}
        />
      )}

      {/* Modals */}
      {updateModalState.isOpen && updateModalState.resource && (
        <UpdateQuantityModal
          isOpen={updateModalState.isOpen}
          resource={updateModalState.resource}
          updateType={updateModalState.updateType}
          onClose={() =>
            setUpdateModalState({
              isOpen: false,
              resource: null,
              updateType: "absolute",
            })
          }
          onUpdate={handleUpdate}
          session={session}
        />
      )}

      {changeTargetModalState.isOpen && changeTargetModalState.resource && (
        <ChangeTargetModal
          isOpen={changeTargetModalState.isOpen}
          resource={changeTargetModalState.resource}
          onClose={() =>
            setChangeTargetModalState({ isOpen: false, resource: null })
          }
          onSave={handleSaveTargetChange}
        />
      )}

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

      {editModalState.isOpen && editModalState.resource && (
        <EditResourceModal
          isOpen={editModalState.isOpen}
          resource={editModalState.resource}
          onClose={() => setEditModalState({ isOpen: false, resource: null })}
          onSave={saveResourceMetadata}
        />
      )}

      {deleteConfirm.showDialog && (
        <div className="bg-background-overlay fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-tile-background border-border-primary mx-4 max-w-md rounded-lg border p-6">
            <div className="mb-4 flex items-center gap-3">
              <Trash2 className="text-text-danger h-8 w-8" />
              <h3 className="text-text-primary text-lg font-semibold">
                Delete Resource
              </h3>
            </div>

            <div className="mb-6">
              <p className="text-text-secondary mb-2">
                Are you sure you want to delete{" "}
                <strong>&quot;{deleteConfirm.resourceName}&quot;</strong>?
              </p>
              <div className="bg-background-danger border-border-danger rounded-lg border p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="text-text-danger mt-0.5 h-5 w-5 shrink-0" />
                  <div className="text-sm">
                    <p className="text-text-danger mb-1 font-medium">
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
                className="text-button-secondary-text bg-button-secondary-bg hover:bg-button-secondary-bg-hover rounded-lg px-4 py-2 text-sm font-medium transition-colors"
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
                className="text-text-white bg-button-danger-bg hover:bg-button-danger-bg-hover rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {saving ? "Deleting..." : "Delete Resource"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
