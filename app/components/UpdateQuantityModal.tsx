"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  QUANTITY_FIELD,
  UPDATE_TYPE,
  type QuantityField,
  type UpdateType,
} from "@/lib/constants";
import { hasResourceAdminAccess } from "@/lib/discord-roles";
import { type User } from "next-auth";

interface UpdateQuantityModalProps {
  resource: {
    id: string;
    name: string;
    quantityHagga: number;
    quantityDeepDesert: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (
    resourceId: string,
    amount: number,
    quantityField: QuantityField,
    updateType: UpdateType,
    reason?: string,
    onBehalfOf?: string,
  ) => Promise<void>;
  updateType: UpdateType;
  session: { user: User } | null;
}

export function UpdateQuantityModal({
  resource,
  isOpen,
  onClose,
  onUpdate,
  updateType,
  session,
}: UpdateQuantityModalProps) {
  const [users, setUsers] = useState<
    { id: string; username: string; customNickname: string | null }[]
  >([]);
  const [onBehalfOf, setOnBehalfOf] = useState<string>("");
  const [amount, setAmount] = useState(0);
  const [quantityField, setQuantityField] = useState<QuantityField>(
    QUANTITY_FIELD.HAGGA,
  );
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [userFetchError, setUserFetchError] = useState<string | null>(null);
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
    if (isOpen) {
      setAmount(0);
      setReason("");
      setError(null);
      setOnBehalfOf("");
      setUserFetchError(null);

      const isResourceAdmin =
        session?.user.permissions?.hasResourceAdminAccess ?? false;
      if (isResourceAdmin) {
        fetch("/api/users")
          .then(async (res) => {
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({}));
              throw new Error(
                errorData.error || `Failed to fetch users: ${res.statusText}`,
              );
            }
            return res.json();
          })
          .then((data) => {
            setUsers(data);
          })
          .catch((err) => {
            console.error("Failed to fetch users:", err);
            setUserFetchError(err.message);
          });
      }
    }
  }, [isOpen, session]);

  const handleUpdate = async () => {
    setError(null);
    if (updateType === UPDATE_TYPE.ABSOLUTE && amount < 0) {
      setError("Amount must be positive for absolute updates.");
      return;
    }

    try {
      await onUpdate(
        resource.id,
        amount,
        quantityField,
        updateType,
        reason,
        onBehalfOf,
      );
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (updateType === UPDATE_TYPE.ABSOLUTE) {
        handleUpdate();
      }
    }
  };

  const handleAdd = async () => {
    setError(null);
    if (amount <= 0) {
      setError("Amount must be positive to add.");
      return;
    }

    try {
      await onUpdate(
        resource.id,
        amount,
        quantityField,
        UPDATE_TYPE.RELATIVE,
        reason,
        onBehalfOf,
      );
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    }
  };

  const handleRemove = async () => {
    setError(null);
    if (amount <= 0) {
      setError("Amount must be positive to remove.");
      return;
    }

    const currentQuantity =
      quantityField === QUANTITY_FIELD.HAGGA
        ? resource.quantityHagga
        : resource.quantityDeepDesert;

    if (amount > currentQuantity) {
      setError("Insufficient quantity.");
      return;
    }

    try {
      await onUpdate(
        resource.id,
        -amount,
        quantityField,
        UPDATE_TYPE.RELATIVE,
        reason,
        onBehalfOf,
      );
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
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
        aria-labelledby="update-quantity-modal-title"
        className={`mx-4 max-w-md transform rounded-lg border border-border-primary bg-background-modal-content p-6 transition-all duration-300 ease-in-out md:max-w-lg md:p-8 ${
          isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <h3
          id="update-quantity-modal-title"
          className="mb-4 text-lg font-semibold text-text-primary"
        >
          {updateType === UPDATE_TYPE.ABSOLUTE ? "Set" : "Add/Remove"}{" "}
          {resource.name}
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="quantity-input" className="mb-1 block text-sm font-medium text-text-secondary">
              {updateType === UPDATE_TYPE.ABSOLUTE ? "New Quantity" : "Amount"}
            </label>
            <input
              id="quantity-input"
              type="number"
              value={amount}
              onChange={(e) =>
                setAmount(Math.max(0, parseInt(e.target.value) || 0))
              }
              onKeyDown={handleKeyDown}
              className="w-full rounded-lg border border-border-secondary bg-background-modal-content-inset px-3 py-2 text-text-primary"
              min="0"
            />
          </div>
          <div>
            <label htmlFor="base-select" className="mb-1 block text-sm font-medium text-text-secondary">
              Base
            </label>
            <select
              id="base-select"
              value={quantityField}
              onChange={(e) =>
                setQuantityField(e.target.value as QuantityField)
              }
              className="w-full rounded-lg border border-border-secondary bg-background-modal-content-inset px-3 py-2 text-text-primary"
            >
              <option value={QUANTITY_FIELD.HAGGA}>Hagga</option>
              <option value={QUANTITY_FIELD.DEEP_DESERT}>Deep Desert</option>
            </select>
          </div>

          {session?.user.permissions?.hasResourceAdminAccess && (
            <div>
              <label htmlFor="on-behalf-of-select" className="mb-1 block text-sm font-medium text-text-secondary">
                On Behalf Of (Admin)
              </label>
              {userFetchError ? (
                <div className="rounded-md bg-background-danger p-2 text-sm text-text-danger">
                  Error: {userFetchError}
                </div>
              ) : (
                <select
                  id="on-behalf-of-select"
                  value={onBehalfOf}
                  onChange={(e) => setOnBehalfOf(e.target.value)}
                  className="w-full rounded-lg border border-border-secondary bg-background-modal-content-inset px-3 py-2 text-text-primary"
                  disabled={users.length === 0}
                >
                  <option value="">Current User</option>
                  {users.map((user) => {
                    const displayName = user.customNickname || user.username;
                    return (
                      <option key={user.id} value={user.id}>
                        {displayName}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          )}

          {error && <p className="text-sm text-text-danger">{error}</p>}
        </div>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Notes (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-border-secondary bg-background-modal-content-inset px-3 py-2 text-text-primary"
              maxLength={250}
              rows={3}
              placeholder="Add a reason for the change..."
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg bg-button-secondary-bg px-4 py-2 text-sm font-medium text-button-secondary-text transition-colors hover:bg-button-secondary-bg-hover"
          >
            Cancel
          </button>
          {updateType === UPDATE_TYPE.ABSOLUTE ? (
            <button
              onClick={handleUpdate}
              className="rounded-lg bg-button-primary-bg px-4 py-2 text-sm font-medium text-text-white transition-colors hover:bg-button-primary-bg-hover"
            >
              Set
            </button>
          ) : (
            <>
              <button
                onClick={handleRemove}
                className="rounded-lg bg-button-danger-bg px-4 py-2 text-sm font-medium text-text-white transition-colors hover:bg-button-danger-bg-hover"
              >
                Remove
              </button>
              <button
                onClick={handleAdd}
                className="rounded-lg bg-button-success-bg px-4 py-2 text-sm font-medium text-text-white transition-colors hover:bg-button-success-bg-hover"
              >
                Add
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
