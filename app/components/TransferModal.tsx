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
        className={`bg-background-modal-content border-border-primary mx-4 max-w-md transform rounded-lg border p-6 transition-all duration-300 ease-in-out md:max-w-lg md:p-8 ${
          isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <h3
          id="transfer-modal-title"
          className="text-text-primary mb-4 text-lg font-semibold"
        >
          Transfer {resource.name}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-text-secondary mb-1 block text-sm font-medium">
              Amount
            </label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
              onKeyDown={handleKeyDown}
              className="border-border-secondary bg-background-modal-content-inset text-text-primary w-full rounded-lg border px-3 py-2"
            />
          </div>
          <div>
            <label className="text-text-secondary mb-1 block text-sm font-medium">
              Direction
            </label>
            <select
              value={direction}
              onChange={(e) =>
                setDirection(e.target.value as TransferDirection)
              }
              className="border-border-secondary bg-background-modal-content-inset text-text-primary w-full rounded-lg border px-3 py-2"
            >
              <option value={TRANSFER_DIRECTION.TO_DEEP_DESERT}>
                Hagga to Deep Desert
              </option>
              <option value={TRANSFER_DIRECTION.TO_HAGGA}>
                Deep Desert to Hagga
              </option>
            </select>
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
            onClick={handleTransfer}
            className="text-text-white bg-button-primary-bg hover:bg-button-primary-bg-hover rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            Transfer
          </button>
        </div>
      </div>
    </div>
  );
}
