"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export function RefreshRolesButton() {
  const { data: session, update } = useSession();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Trigger session update which will fetch fresh Discord data including nickname
      await update();
    } catch (error) {
      console.error("Failed to refresh session:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!session) return null;

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="text-text-link bg-background-info border-border-info hover:bg-background-info-hover inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg
        className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      {isRefreshing ? "Refreshing..." : "Refresh"}
    </button>
  );
}
