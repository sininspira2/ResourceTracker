"use client";

import { useState, useEffect } from "react";

// Utility function to format numbers with commas
const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

interface HistoryEntry {
  id: string;
  resourceId: string;
  previousQuantityHagga: number;
  newQuantityHagga: number;
  changeAmountHagga: number;
  previousQuantityDeepDesert: number;
  newQuantityDeepDesert: number;
  changeAmountDeepDesert: number;
  transferAmount?: number;
  transferDirection?: "to_deep_desert" | "to_hagga";
  changeType: "absolute" | "relative" | "transfer";
  updatedBy: string;
  reason?: string;
  createdAt: string;
}

interface ResourceHistoryChartProps {
  resourceId: string;
  resourceName: string;
  customButton?: {
    className?: string;
    children?: React.ReactNode;
  };
}

export function ResourceHistoryChart({
  resourceId,
  resourceName,
  customButton,
}: ResourceHistoryChartProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<HistoryEntry | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isOpen) return;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/resources/${resourceId}/history?days=${days}`,
        );
        if (response.ok) {
          const data = await response.json();
          setHistory(data);
        }
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [resourceId, days, isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={
          customButton?.className ||
          "text-text-tertiary hover:text-text-link hover:bg-background-secondary rounded-sm p-1 transition-colors"
        }
        title="View resource history"
      >
        {customButton?.children || (
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
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}
      </button>
    );
  }

  return (
    <div className="bg-background-overlay fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-background-primary mx-4 max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg shadow-xl">
        <div className="flex items-center justify-between border-b p-6">
          <div>
            <h2 className="text-xl font-semibold">{resourceName} - History</h2>
            <p className="text-text-tertiary text-sm">Last {days} days</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="rounded-sm border px-3 py-1 text-sm"
            >
              <option value={1}>1 day</option>
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
            <button
              onClick={() => setIsOpen(false)}
              className="text-text-quaternary hover:text-text-tertiary text-xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-6">
          {loading ? (
            <div className="py-8 text-center">
              <div className="border-text-link mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
              <p className="text-text-tertiary mt-2">Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-text-quaternary">
                No changes in the last {days} days
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Simple line chart visualization */}
              <div className="bg-background-secondary rounded-lg p-4">
                <h3 className="mb-3 text-sm font-medium">Quantity Over Time</h3>
                <div className="relative h-32">
                  {history.length > 1 && (
                    <div className="relative">
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
                        {history
                          .slice()
                          .reverse()
                          .map((entry, index, arr) => {
                            if (index === arr.length - 1) return null;
                            const nextEntry = arr[index + 1];

                            const x1 = (index / (arr.length - 1)) * 100;
                            const x2 = ((index + 1) / (arr.length - 1)) * 100;

                            const maxQuantity = Math.max(
                              ...history.map((h) =>
                                Math.max(
                                  h.previousQuantityHagga +
                                    h.previousQuantityDeepDesert,
                                  h.newQuantityHagga + h.newQuantityDeepDesert,
                                ),
                              ),
                            );
                            const y1 =
                              100 -
                              ((entry.newQuantityHagga +
                                entry.newQuantityDeepDesert) /
                                maxQuantity) *
                                80;
                            const y2 =
                              100 -
                              ((nextEntry.newQuantityHagga +
                                nextEntry.newQuantityDeepDesert) /
                                maxQuantity) *
                                80;

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
                            );
                          })}

                        {/* Data points */}
                        {history
                          .slice()
                          .reverse()
                          .map((entry, index, arr) => {
                            const x = (index / (arr.length - 1)) * 100;
                            const maxQuantity = Math.max(
                              ...history.map((h) =>
                                Math.max(
                                  h.previousQuantityHagga +
                                    h.previousQuantityDeepDesert,
                                  h.newQuantityHagga + h.newQuantityDeepDesert,
                                ),
                              ),
                            );
                            const y =
                              100 -
                              ((entry.newQuantityHagga +
                                entry.newQuantityDeepDesert) /
                                maxQuantity) *
                                80;

                            return (
                              <circle
                                key={`point-${entry.id}`}
                                cx={`${x}%`}
                                cy={`${y}%`}
                                r="4"
                                fill="#3b82f6"
                                stroke="white"
                                strokeWidth="2"
                                className="hover:r-6 cursor-pointer transition-all"
                                onMouseEnter={() => setHoveredPoint(entry)}
                                onMouseLeave={() => setHoveredPoint(null)}
                              />
                            );
                          })}
                      </svg>

                      {/* Tooltip */}
                      {hoveredPoint && (
                        <div
                          className="text-text-white pointer-events-none absolute z-10 rounded-sm bg-black px-2 py-1 text-xs whitespace-nowrap"
                          style={{
                            left: mousePosition.x + 10,
                            top: mousePosition.y - 10,
                            transform:
                              mousePosition.x > 200
                                ? "translateX(-100%)"
                                : "none",
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
                            {new Date(
                              hoveredPoint.createdAt,
                            ).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* History list */}
              <div>
                <h3 className="mb-3 text-sm font-medium">Recent Changes</h3>
                <div className="space-y-3">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-background-secondary flex items-center justify-between rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-3 w-3 rounded-full ${
                            entry.changeAmountHagga +
                              entry.changeAmountDeepDesert >
                            0
                              ? "bg-activity-positive-bg"
                              : entry.changeAmountHagga +
                                    entry.changeAmountDeepDesert <
                                  0
                                ? "bg-activity-negative-bg"
                                : "bg-activity-neutral-bg"
                          }`}
                        ></div>
                        <div>
                          <div className="font-medium">
                            {entry.changeType === "transfer" ? (
                              <span>
                                Transfer {entry.transferAmount}{" "}
                                {entry.transferDirection === "to_deep_desert"
                                  ? "to Deep Desert"
                                  : "to Hagga"}
                              </span>
                            ) : (
                              <div>
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
                          </div>
                          <div className="text-text-tertiary text-sm">
                            By {entry.updatedBy}
                            {entry.reason && (
                              <span className="text-text-link ml-2">
                                • {entry.reason}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-text-quaternary text-sm">
                        {new Date(entry.createdAt).toLocaleDateString()}{" "}
                        {new Date(entry.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
