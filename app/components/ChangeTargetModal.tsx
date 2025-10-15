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
      className={`fixed inset-0 flex items-center justify-center z-50 transition-colors duration-300 ease-in-out ${
        isAnimating ? "bg-background-modal" : "bg-black/0"
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
        className={`bg-background-primary rounded-lg p-6 md:p-8 max-w-md md:max-w-lg mx-4 border border-border-primary transition-all duration-300 ease-in-out transform ${
          isAnimating ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <h3
          id="change-target-modal-title"
          className="text-lg font-semibold text-text-primary mb-4"
        >
          Change Target for {resource.name}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              New Target Quantity
            </label>
            <input
              type="number"
              min="0"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value) || 0)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-border-secondary rounded-lg bg-background-primary text-text-primary"
            />
          </div>
          {error && <p className="text-text-danger text-sm">{error}</p>}
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-button-secondary-text bg-button-secondary-bg hover:bg-button-secondary-bg-hover rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-text-white bg-button-primary-bg hover:bg-button-primary-bg-hover rounded-lg transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}