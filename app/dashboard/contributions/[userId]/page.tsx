"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Pagination } from "@/app/components/Pagination";

interface Contribution {
  id: string;
  resourceId: string;
  actionType: "ADD" | "SET" | "REMOVE";
  quantityChanged: number;
  basePoints: number;
  resourceMultiplier: number;
  statusBonus: number;
  finalPoints: number;
  resourceName: string;
  resourceCategory: string;
  resourceStatus: string;
  createdAt: string;
}

interface ContributionsData {
  userId: string;
  timeFilter: string;
  rank: number | null;
  contributions: Contribution[];
  summary: {
    totalPoints: number;
    totalActions: number;
  };
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const timeFilterOptions = [
  { value: "24h", label: "Last 24 Hours" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "all", label: "All Time" },
];

export default function UserContributionsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [data, setData] = useState<ContributionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("7d");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const userId = params.userId as string;
  const pageSize = 20;

  const fetchContributions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/leaderboard/${userId}?timeFilter=${timeFilter}&page=${currentPage}&pageSize=${pageSize}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch contributions");
      }

      const contributionsData = await response.json();
      setData(contributionsData);
    } catch (error) {
      console.error("Error fetching contributions:", error);
      setError("Failed to load contributions");
    } finally {
      setLoading(false);
    }
  }, [userId, timeFilter, currentPage, pageSize]);

  useEffect(() => {
    fetchContributions();
  }, [fetchContributions]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleTimeFilterChange = (newTimeFilter: string) => {
    setTimeFilter(newTimeFilter);
    setCurrentPage(1); // Reset to first page when changing filters
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "ADD":
        return (
          <svg
            className="text-text-success h-4 w-4"
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
        );
      case "SET":
        return (
          <svg
            className="text-text-link h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        );
      case "REMOVE":
        return (
          <svg
            className="text-text-danger h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 12H4"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "text-status-critical-text bg-status-critical-bg-subtle";
      case "below_target":
        return "text-status-below-target-text bg-status-below-target-bg-subtle";
      case "at_target":
        return "text-status-at-target-text bg-status-at-target-bg-subtle";
      case "above_target":
        return "text-status-above-target-text bg-status-above-target-bg-subtle";
      default:
        return "text-status-default-text bg-status-default-bg-subtle";
    }
  };

  if (loading && !data) {
    return (
      <div className="bg-background-primary min-h-screen py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="border-text-link mx-auto h-12 w-12 animate-spin rounded-full border-b-2"></div>
            <p className="text-text-tertiary mt-4">Loading contributions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background-primary min-h-screen py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-text-danger">{error}</p>
            <button
              onClick={() => router.push("/resources")}
              className="bg-button-primary-bg hover:bg-button-primary-bg-hover text-text-white mt-4 rounded-lg px-4 py-2"
            >
              Back to Resources
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="bg-background-primary min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-background-panel mb-6 rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-text-primary text-2xl font-bold">
                Contribution History
              </h1>
              <p className="text-text-tertiary mt-1">User: {userId}</p>
            </div>
            <button
              onClick={() => router.push("/resources")}
              className="bg-button-secondary-neutral-bg hover:bg-button-secondary-neutral-bg-hover text-button-secondary-text rounded-lg px-4 py-2"
            >
              Back to Resources
            </button>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="bg-button-subtle-blue-bg rounded-lg p-4">
              <div className="text-text-link text-2xl font-bold">
                {(data.summary?.totalPoints || 0).toFixed(1)}
              </div>
              <div className="text-button-subtle-blue-text text-sm">
                Total Points
              </div>
            </div>
            <div className="bg-button-subtle-green-bg rounded-lg p-4">
              <div className="text-text-success text-2xl font-bold">
                {data.summary?.totalActions || 0}
              </div>
              <div className="text-button-subtle-green-text text-sm">
                Total Actions
              </div>
            </div>
            <div className="bg-button-subtle-purple-bg rounded-lg p-4">
              <div className="text-text-purple text-2xl font-bold">
                {data.rank ? `#${data.rank}` : "Unranked"}
              </div>
              <div className="text-text-purple-subtle text-sm">
                Current Rank
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-background-panel mb-6 rounded-lg p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <label className="text-text-primary text-sm font-medium">
              Time Period:
            </label>
            <select
              value={timeFilter}
              onChange={(e) => handleTimeFilterChange(e.target.value)}
              className="bg-background-panel-inset border-border-secondary text-text-primary rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              {timeFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Contributions List */}
        <div className="bg-background-panel rounded-lg shadow-lg">
          <div className="border-border-primary border-b p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-text-primary text-lg font-semibold">
                Recent Contributions
              </h2>
              {data.total > 0 && (
                <p className="text-text-quaternary text-sm">
                  {data.total} total contributions
                </p>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="border-text-link mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
              <p className="text-text-tertiary mt-2">Loading...</p>
            </div>
          ) : data.contributions.length === 0 ? (
            <div className="p-8 text-center">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-text-quaternary">
                No contributions found for this time period
              </p>
            </div>
          ) : (
            <>
              <div className="divide-border-primary divide-y">
                {data.contributions.map((contribution) => (
                  <div
                    key={contribution.id}
                    className="hover:bg-button-secondary-bg p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="shrink-0">
                          {getActionIcon(contribution.actionType)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-text-primary font-medium">
                              {contribution.resourceName}
                            </h3>
                            <span
                              className={`rounded-full px-2 py-1 text-xs ${getStatusColor(contribution.resourceStatus)}`}
                            >
                              {contribution.resourceStatus.replace("_", " ")}
                            </span>
                          </div>
                          <div className="text-text-quaternary mt-1 flex items-center gap-4 text-sm">
                            <span>
                              {contribution.actionType.toLowerCase()}{" "}
                              {contribution.quantityChanged.toLocaleString()}
                            </span>
                            <span>•</span>
                            <span>{contribution.resourceCategory}</span>
                            <span>•</span>
                            <span>{formatDate(contribution.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-text-success font-bold">
                          +{contribution.finalPoints.toFixed(1)} pts
                        </div>
                        <div className="text-text-quaternary text-xs">
                          {contribution.resourceMultiplier}x multiplier
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
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
            </>
          )}
        </div>

        {/* Points System Info */}
        <div className="bg-background-info border-border-info mt-6 rounded-lg border p-6">
          <h3 className="text-text-primary mb-3 text-lg font-semibold">
            📊 How Points Work
          </h3>
          <div className="text-text-secondary space-y-2 text-sm">
            <p>
              <strong>ADD Actions:</strong> 0.1 points per resource (100 points
              per 1000 resources)
            </p>
            <p>
              <strong>SET Actions:</strong> Fixed 1 points regardless of
              quantity
            </p>
            <p>
              <strong>Refined Actions:</strong> Fixed 2 points for any action
              (special category)
            </p>
            <p>
              <strong>Multipliers:</strong> Resources have different point
              multipliers (0.1x to 5x+)
            </p>
            <p>
              <strong>Status Bonuses:</strong> Critical resources +10%, Below
              Target +5%
            </p>
            <p>
              <strong>Categories:</strong> Raw, Components, and Refined
              categories earn points
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
