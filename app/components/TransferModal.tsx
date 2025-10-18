"use client";

import { useState, useEffect } from "react";
import { TRANSFER_DIRECTION, type TransferDirection } from "@/lib/constants";

interface TransferModalProps {
  resource: {
    id: string;
    name: string;
    quantityHagga: number;
    quantityDeepDesert: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (
    resourceId: string,
    amount: number,
    direction: TransferDirection,
  ) => Promise<void>;
}

export function TransferModal({
  resource,
  isOpen,
  onClose,
  onTransfer,
}: TransferModalProps) {
  const [amount, setAmount] = useState(0);
  const [direction, setDirection] = useState<TransferDirection>(
    TRANSFER_DIRECTION.TO_DEEP_DESERT,
  );
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

  const handleTransfer = async () => {
    setError(null);
    if (amount <= 0) {
      setError("Amount must be positive.");
      return;
    }
    if (
      direction === TRANSFER_DIRECTION.TO_DEEP_DESERT &&
      amount > resource.quantityHagga
    ) {
      setError("Insufficient quantity in Hagga base.");
      return;
    }
    if (
      direction === TRANSFER_DIRECTION.TO_HAGGA &&
      amount > resource.quantityDeepDesert
    ) {
      setError("Insufficient quantity in Deep Desert base.");
      return;
    }

    try {
      await onTransfer(resource.id, amount, direction);
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTransfer();
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
        aria-labelledby="transfer-modal-title"
        className={`mx-4 max-w-md transform rounded-lg border border-border-primary bg-background-modal-content p-6 transition-all duration-300 ease-in-out md:max-w-lg md:p-8 ${
          isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <h3
          id="transfer-modal-title"
          className="mb-4 text-lg font-semibold text-text-primary"
        >
          Transfer {resource.name}
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="amount-input" className="mb-1 block text-sm font-medium text-text-secondary">
              Amount
            </label>
            <input
              id="amount-input"
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-lg border border-border-secondary bg-background-modal-content-inset px-3 py-2 text-text-primary"
            />
          </div>
          <div>
            <label htmlFor="direction-select" className="mb-1 block text-sm font-medium text-text-secondary">
              Direction
            </label>
            <select
              id="direction-select"
              value={direction}
              onChange={(e) =>
                setDirection(e.target.value as TransferDirection)
              }
              className="w-full rounded-lg border border-border-secondary bg-background-modal-content-inset px-3 py-2 text-text-primary"
            >
              <option value={TRANSFER_DIRECTION.TO_DEEP_DESERT}>
                Hagga to Deep Desert
              </option>
              <option value={TRANSFER_DIRECTION.TO_HAGGA}>
                Deep Desert to Hagga
              </option>
            </select>
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
            onClick={handleTransfer}
            className="rounded-lg bg-button-primary-bg px-4 py-2 text-sm font-medium text-text-white transition-colors hover:bg-button-primary-bg-hover"
          >
            Transfer
          </button>
        </div>
      </div>
    </div>
  );
}
