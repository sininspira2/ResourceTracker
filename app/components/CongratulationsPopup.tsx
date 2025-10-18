"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface PointsCalculation {
  basePoints: number;
  resourceMultiplier: number;
  statusBonus: number;
  finalPoints: number;
}

interface CongratulationsPopupProps {
  isVisible: boolean;
  onClose: () => void;
  pointsEarned: number;
  pointsCalculation?: PointsCalculation;
  resourceName: string;
  actionType: "ADD" | "SET" | "REMOVE";
  quantityChanged: number;
  userId?: string;
}

export function CongratulationsPopup({
  isVisible,
  onClose,
  pointsEarned,
  pointsCalculation,
  resourceName,
  actionType,
  quantityChanged,
  userId,
}: CongratulationsPopupProps) {
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClose = useCallback(() => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for animation to complete
  }, [onClose]);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, handleClose]);

  const handleViewContributions = () => {
    if (userId) {
      router.push(`/dashboard/contributions/${userId}`);
    }
    handleClose();
  };

  if (!isVisible) return null;

  const getActionText = () => {
    switch (actionType) {
      case "ADD":
        return `Added ${quantityChanged.toLocaleString()}`;
      case "SET":
        return `Set quantity`;
      case "REMOVE":
        return `Removed ${quantityChanged.toLocaleString()}`;
      default:
        return "Updated";
    }
  };

  const getMultiplierDisplay = (multiplier: number) => {
    if (multiplier === 1) return "1x";
    return `${multiplier}x`;
  };

  const getBonusDisplay = (bonus: number) => {
    if (bonus === 0) return "No bonus";
    return `+${(bonus * 100).toFixed(0)}% bonus`;
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-end p-4">
      <div
        className={`pointer-events-auto w-full max-w-sm transform rounded-lg border border-border-primary bg-background-modal-content shadow-2xl transition-all duration-300 md:max-w-md ${isAnimating ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"} `}
      >
        {/* Header */}
        <div className="bg-gradient-success rounded-t-lg p-4 text-text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-lg font-bold">Congratulations!</h3>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 transition-colors hover:text-white"
              aria-label="close"
            >
              <svg
                className="h-5 w-5"
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
        </div>

        {/* Content */}
        <div className="p-4">
          {pointsEarned > 0 ? (
            <>
              <div className="mb-4 text-center">
                <div className="mb-2 flex items-center justify-center gap-1">
                  <svg
                    className="h-6 w-6 text-text-warning"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="text-2xl font-bold text-text-success">
                    +{pointsEarned.toFixed(1)} points
                  </span>
                  <svg
                    className="h-6 w-6 text-text-warning"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <p className="text-sm text-text-tertiary">
                  {getActionText()} {resourceName}
                </p>
              </div>

              {/* Points Breakdown */}
              {pointsCalculation && (
                <div className="mb-4 rounded-lg bg-background-secondary p-3 text-sm text-text-primary">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Base points:</span>
                      <span className="text-text-primary">
                        {pointsCalculation.basePoints.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Multiplier:</span>
                      <span className="text-text-primary">
                        {getMultiplierDisplay(
                          pointsCalculation.resourceMultiplier,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Status bonus:</span>
                      <span className="text-text-primary">
                        {getBonusDisplay(pointsCalculation.statusBonus)}
                      </span>
                    </div>
                    <hr className="my-2 border-border-secondary" />
                    <div className="flex justify-between font-bold">
                      <span className="text-text-primary">Total:</span>
                      <span className="text-text-primary">
                        {pointsCalculation.finalPoints.toFixed(1)} pts
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleViewContributions}
                className="w-full rounded-lg bg-button-primary-bg px-4 py-2 font-medium text-text-white transition-colors hover:bg-button-primary-bg-hover"
              >
                View My Contributions
              </button>
            </>
          ) : (
            <div className="text-center">
              <p className="mb-2 text-text-tertiary">
                {getActionText()} {resourceName}
              </p>
              <p className="text-sm text-text-quaternary">
                No points earned for this action
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
