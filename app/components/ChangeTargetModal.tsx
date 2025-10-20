"use client";

import { useState, useEffect } from "react";

interface ChangeTargetModalProps {
  resource: {
    id: string;
    name: string;
    targetQuantity?: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onSave: (resourceId: string, newTarget: number) => Promise<void>;
}

export function ChangeTargetModal({
  resource,
  isOpen,
  onClose,
  onSave,
}: ChangeTargetModalProps) {
  const [target, setTarget] = useState(resource.targetQuantity || 0);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowModal(true);
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setShowModal(false), 300); // Animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    setTarget(resource?.targetQuantity || 0);
  }, [resource]);

  const handleSave = async () => {
    setError(null);
    if (target < 0) {
      setError("Target cannot be negative.");
      return;
    }

    try {
      await onSave(resource.id, target);
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  if (!showModal) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-colors duration-300 ease-in-out ${
        isAnimating ? "bg-background-overlay" : "bg-black/0"
      }`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-target-modal-title"
        className={`mx-4 max-w-md transform rounded-lg border border-border-primary bg-background-modal-content p-6 transition-all duration-300 ease-in-out md:max-w-lg md:p-8 ${
          isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <h3
          id="change-target-modal-title"
          className="mb-4 text-lg font-semibold text-text-primary"
        >
          Change Target for {resource.name}
        </h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="target-quantity-input"
              className="mb-1 block text-sm font-medium text-text-secondary"
            >
              New Target Quantity
            </label>
            <input
              id="target-quantity-input"
              type="number"
              min="0"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value) || 0)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-lg border border-border-secondary bg-background-modal-content-inset px-3 py-2 text-text-primary"
            />
          </div>
          {error && <p className="text-sm text-text-danger">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg bg-button-secondary-bg px-4 py-2 text-sm font-medium text-button-secondary-text transition-colors hover:bg-button-secondary-bg-hover"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-button-primary-bg px-4 py-2 text-sm font-medium text-text-white transition-colors hover:bg-button-primary-bg-hover"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
