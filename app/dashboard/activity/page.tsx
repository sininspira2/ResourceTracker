"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
// Note: hasResourceAccess now computed server-side and available in session.user.permissions

// Utility function to format numbers with commas
const formatNumber = (num: number): string => {
  return num.toLocaleString();
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

interface ActivityEntry {
  id: string;
  resourceId: string;
  resourceName: string;
  previousQuantityHagga: number;
  newQuantityHagga: number;
  changeAmountHagga: number;
  previousQuantityDeepDesert: number;
  newQuantityDeepDesert: number;
  changeAmountDeepDesert: number;
  transferAmount?: number;
  transferDirection?: "to_deep_desert" | "to_hagga";
  changeAmount: number; // This is the total change amount, added in the API
  changeType: "absolute" | "relative" | "transfer";
  reason?: string;
  createdAt: string;
}

export default function ActivityLogPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState(30); // days
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    if (status === "loading") {
      return;
    }

    if (
      status === "authenticated" &&
      (!session || !session.user?.permissions?.hasResourceAccess)
    ) {
      router.push("/");
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!session?.user) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/user/activity?days=${timeFilter}`);

        if (response.ok) {
          const data = await response.json();
          setActivities(data);
        }
      } catch (error) {
        console.error("Error fetching activity:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchActivities();
    }
  }, [session, timeFilter]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-primary">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-text-link"></div>
          <p className="mt-4 text-text-tertiary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary transition-colors duration-300">
      {/* Header */}
      <div className="border-b border-border-primary bg-background-secondary shadow-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center text-text-tertiary transition-colors hover:text-text-primary"
              >
                <ArrowLeft className="h-5 w-5 sm:mr-2" />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-border-secondary"></div>
              <h1 className="text-xl font-semibold text-text-primary">
                Your Activity Log
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-text-tertiary">Time Range:</span>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(parseInt(e.target.value))}
                className="rounded-sm border border-border-secondary bg-background-primary px-3 py-1 text-sm text-text-primary"
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 3 months</option>
                <option value={365}>Last year</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="py-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-text-link"></div>
            <p className="mt-4 text-text-tertiary">Loading your activity...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="py-12 text-center">
            <svg
              className="mx-auto mb-4 h-16 w-16 text-text-quaternary"
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
            <h3 className="mb-2 text-lg font-medium text-text-primary">
              No activity found
            </h3>
            <p className="text-text-tertiary">
              You haven&apos;t made any resource changes in the last{" "}
              {timeFilter} days.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="rounded-lg border border-border-primary bg-background-panel p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-text-primary">
                Summary
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-text-primary">
                    {activities.length}
                  </div>
                  <div className="text-sm text-text-tertiary">
                    Total Changes
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-text-success">
                    {activities.filter((a) => a.changeAmount > 0).length}
                  </div>
                  <div className="text-sm text-text-tertiary">Additions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-text-danger">
                    {activities.filter((a) => a.changeAmount < 0).length}
                  </div>
                  <div className="text-sm text-text-tertiary">Removals</div>
                </div>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="rounded-lg border border-border-primary bg-background-panel p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-semibold text-text-primary">
                Activity Timeline
              </h2>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 rounded-lg bg-button-secondary-neutral-bg p-4 transition-colors hover:bg-button-secondary-neutral-bg-hover"
                  >
                    <div
                      className={`mt-2 h-3 w-3 rounded-full ${
                        activity.changeAmount > 0
                          ? "bg-activity-positive-bg"
                          : activity.changeAmount < 0
                            ? "bg-activity-negative-bg"
                            : "bg-activity-neutral-bg"
                      }`}
                    ></div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <Link
                              href={`/resources/${activity.resourceId}`}
                              className="font-medium text-text-primary transition-colors hover:text-text-link"
                            >
                              {activity.resourceName}
                            </Link>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs ${
                                activity.changeType === "relative"
                                  ? "bg-button-subtle-blue-bg text-button-subtle-blue-text"
                                  : "bg-button-subtle-gray-bg text-button-subtle-gray-text"
                              }`}
                            >
                              {activity.changeType === "relative"
                                ? "+/-"
                                : "Set"}
                            </span>
                          </div>
                          <div className="text-sm text-text-tertiary">
                            {activity.changeType === "transfer" ? (
                              <span>
                                Transfer {activity.transferAmount}{" "}
                                {activity.transferDirection === "to_deep_desert"
                                  ? "to Deep Desert"
                                  : "to Hagga"}
                              </span>
                            ) : (
                              <div>
                                <div>
                                  Hagga:{" "}
                                  {formatNumber(activity.previousQuantityHagga)}{" "}
                                  → {formatNumber(activity.newQuantityHagga)}
                                </div>
                                <div>
                                  Deep Desert:{" "}
                                  {formatNumber(
                                    activity.previousQuantityDeepDesert,
                                  )}{" "}
                                  →{" "}
                                  {formatNumber(activity.newQuantityDeepDesert)}
                                </div>
                              </div>
                            )}
                            <span
                              className={`ml-2 font-medium ${
                                activity.changeAmount > 0
                                  ? "text-text-success"
                                  : activity.changeAmount < 0
                                    ? "text-text-danger"
                                    : "text-text-tertiary"
                              }`}
                            >
                              (Total change:{" "}
                              {activity.changeAmount > 0 ? "+" : ""}
                              {formatNumber(activity.changeAmount)})
                            </span>
                          </div>
                          {activity.reason && (
                            <div className="mt-1 text-sm text-text-link">
                              Reason: {activity.reason}
                            </div>
                          )}
                        </div>
                        <div className="text-right text-sm text-text-quaternary">
                          <div
                            className="cursor-help decoration-dotted hover:underline"
                            title={`${new Date(activity.createdAt).toLocaleDateString()} at ${new Date(activity.createdAt).toLocaleTimeString()}`}
                          >
                            {getRelativeTime(activity.createdAt, currentTime)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
