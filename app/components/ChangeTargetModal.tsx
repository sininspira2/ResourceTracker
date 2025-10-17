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
        className={`bg-background-modal-content border-border-primary mx-4 max-w-md transform rounded-lg border p-6 transition-all duration-300 ease-in-out md:max-w-lg md:p-8 ${
          isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <h3
          id="change-target-modal-title"
          className="text-text-primary mb-4 text-lg font-semibold"
        >
          Change Target for {resource.name}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-text-secondary mb-1 block text-sm font-medium">
              New Target Quantity
            </label>
            <input
              type="number"
              min="0"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value) || 0)}
              onKeyDown={handleKeyDown}
              className="border-border-secondary bg-background-modal-content-inset text-text-primary w-full rounded-lg border px-3 py-2"
            />
          </div>
          {error && <p className="text-text-danger text-sm">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="text-button-secondary-text bg-button-secondary-bg hover:bg-button-secondary-bg-hover rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="text-text-white bg-button-primary-bg hover:bg-button-primary-bg-hover rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
