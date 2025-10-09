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
            className="w-4 h-4 text-green-600"
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
            className="w-4 h-4 text-blue-600"
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
            className="w-4 h-4 text-red-600"
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
        return "text-red-600 bg-red-100 dark:bg-red-900/20";
      case "below_target":
        return "text-orange-600 bg-orange-100 dark:bg-orange-900/20";
      case "at_target":
        return "text-green-600 bg-green-100 dark:bg-green-900/20";
      case "above_target":
        return "text-purple-600 bg-purple-100 dark:bg-purple-900/20";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-900/20";
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              Loading contributions...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={() => router.push("/resources")}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Contribution History
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                User: {userId}
              </p>
            </div>
            <button
              onClick={() => router.push("/resources")}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              Back to Resources
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {(data.summary?.totalPoints || 0).toFixed(1)}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                Total Points
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {data.summary?.totalActions || 0}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                Total Actions
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {data.rank ? `#${data.rank}` : "Unranked"}
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">
                Current Rank
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
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

        {/* Contributions List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Recent Contributions
              </h2>
              {data.total > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {data.total} total contributions
                </p>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Loading...
              </p>
            </div>
          ) : data.contributions.length === 0 ? (
            <div className="p-8 text-center">
              <svg
                className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4"
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
              <p className="text-gray-500 dark:text-gray-400">
                No contributions found for this time period
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.contributions.map((contribution) => (
                  <div
                    key={contribution.id}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="shrink-0">
                          {getActionIcon(contribution.actionType)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">
                              {contribution.resourceName}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${getStatusColor(contribution.resourceStatus)}`}
                            >
                              {contribution.resourceStatus.replace("_", " ")}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
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
                        <div className="font-bold text-green-600 dark:text-green-400">
                          +{contribution.finalPoints.toFixed(1)} pts
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
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
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
            📊 How Points Work
          </h3>
          <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
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
