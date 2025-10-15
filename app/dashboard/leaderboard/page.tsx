"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Pagination } from "@/app/components/Pagination";

interface LeaderboardEntry {
  userId: string;
  totalPoints: number;
  totalActions: number;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
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

export default function LeaderboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("7d");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const pageSize = 20;

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/leaderboard?timeFilter=${timeFilter}&page=${currentPage}&pageSize=${pageSize}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard");
      }

      const leaderboardData = await response.json();
      setData(leaderboardData);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      setError("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [timeFilter, currentPage, pageSize]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleUserClick = (userId: string) => {
    router.push(`/dashboard/contributions/${userId}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleTimeFilterChange = (newTimeFilter: string) => {
    setTimeFilter(newTimeFilter);
    setCurrentPage(1); // Reset to first page when changing filters
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-background-secondary py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-text-link mx-auto"></div>
            <p className="mt-4 text-text-tertiary">Loading leaderboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-secondary py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-background-primary rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">
                🏆 Leaderboard
              </h1>
              <p className="text-text-secondary mt-1">
                Top contributors in the{" "}
                {process.env.NEXT_PUBLIC_ORG_NAME || "community"}
              </p>
            </div>
            <button
              onClick={() => router.push("/resources")}
              className="bg-button-secondary-bg hover:bg-button-secondary-bg-hover text-button-secondary-text px-4 py-2 rounded-lg"
            >
              Back to Resources
            </button>
          </div>

          {/* Time Filter */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Time Period:
            </label>
            <select
              value={timeFilter}
              onChange={(e) => handleTimeFilterChange(e.target.value)}
              className="text-xs bg-background-tertiary border border-border-secondary rounded-sm px-2 py-1"
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
          <div className="bg-background-danger border border-border-danger rounded-lg p-4 mb-6">
            <p className="text-text-danger">{error}</p>
            <button
              onClick={fetchLeaderboard}
              className="mt-2 text-sm text-text-danger hover:text-danger-hover"
            >
              Try again
            </button>
          </div>
        )}

        {/* Leaderboard */}
        <div className="bg-background-primary rounded-lg shadow-lg">
          <div className="p-6 border-b border-border-primary">
            <h2 className="text-lg font-semibold text-text-primary">
              Rankings (
              {timeFilterOptions.find((opt) => opt.value === timeFilter)?.label}
              )
            </h2>
            {data && (
              <p className="text-sm text-text-quaternary mt-1">
                Showing {data.total} contributors
              </p>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-text-link mx-auto"></div>
              <p className="mt-2 text-text-tertiary">Loading...</p>
            </div>
          ) : !data || data.leaderboard.length === 0 ? (
            <div className="p-8 text-center">
              <svg
                className="w-16 h-16 mx-auto text-text-quaternary mb-4"
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
              <p className="text-sm text-text-quaternary mt-1">
                Try selecting a different time period or start contributing to
                appear on the leaderboard!
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-border-primary">
                {data.leaderboard.map((entry, index) => {
                  // Calculate global rank based on current page
                  const globalRank = (currentPage - 1) * pageSize + index + 1;

                  return (
                    <div
                      key={entry.userId}
                      className="p-6 hover:bg-background-secondary transition-colors cursor-pointer"
                      onClick={() => handleUserClick(entry.userId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                              globalRank === 1
                                ? "bg-rank-1-bg text-rank-1-text"
                                : globalRank === 2
                                  ? "bg-rank-2-bg text-rank-2-text"
                                  : globalRank === 3
                                    ? "bg-rank-3-bg text-rank-3-text"
                                    : "bg-rank-other-bg text-rank-other-text"
                            }`}
                          >
                            #{globalRank}
                          </div>
                          <div>
                            <h3 className="font-medium text-text-primary">
                              {entry.userId}
                            </h3>
                            <div className="flex items-center gap-4 mt-1 text-sm text-text-quaternary">
                              <span>{entry.totalActions} actions</span>
                              <span>•</span>
                              <span>
                                {(
                                  entry.totalPoints / entry.totalActions
                                ).toFixed(1)}{" "}
                                pts/action
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-text-link">
                            {entry.totalPoints.toFixed(1)} pts
                          </div>
                          <div className="text-xs text-text-quaternary flex items-center gap-1">
                            Click to view details
                            <svg
                              className="w-3 h-3"
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
                    </div>
                  );
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
        <div className="bg-background-info border border-border-info rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-text-primary mb-3">
            📊 How Points Work
          </h3>
          <div className="space-y-2 text-sm text-text-secondary">
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
