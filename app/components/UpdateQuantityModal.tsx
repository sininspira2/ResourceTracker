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
        aria-labelledby="update-quantity-modal-title"
        className={`bg-background-primary rounded-lg p-6 md:p-8 max-w-md md:max-w-lg mx-4 border border-border-primary transition-all duration-300 ease-in-out transform ${
          isAnimating ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <h3
          id="update-quantity-modal-title"
          className="text-lg font-semibold text-text-primary mb-4"
        >
          {updateType === UPDATE_TYPE.ABSOLUTE ? "Set" : "Add/Remove"}{" "}
          {resource.name}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {updateType === UPDATE_TYPE.ABSOLUTE ? "New Quantity" : "Amount"}
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) =>
                setAmount(Math.max(0, parseInt(e.target.value) || 0))
              }
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-border-secondary rounded-lg bg-background-primary text-text-primary"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Base
            </label>
            <select
              value={quantityField}
              onChange={(e) =>
                setQuantityField(e.target.value as QuantityField)
              }
              className="w-full px-3 py-2 border border-border-secondary rounded-lg bg-background-primary text-text-primary"
            >
              <option value={QUANTITY_FIELD.HAGGA}>Hagga</option>
              <option value={QUANTITY_FIELD.DEEP_DESERT}>Deep Desert</option>
            </select>
          </div>

          {session?.user.permissions?.hasResourceAdminAccess && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                On Behalf Of (Admin)
              </label>
              {userFetchError ? (
                <div className="text-text-danger text-sm p-2 bg-background-danger rounded-md">
                  Error: {userFetchError}
                </div>
              ) : (
                <select
                  value={onBehalfOf}
                  onChange={(e) => setOnBehalfOf(e.target.value)}
                  className="w-full px-3 py-2 border border-border-secondary rounded-lg bg-background-primary text-text-primary"
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

          {error && <p className="text-text-danger text-sm">{error}</p>}
        </div>
        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-border-secondary rounded-lg bg-background-primary text-text-primary"
              maxLength={250}
              rows={3}
              placeholder="Add a reason for the change..."
            />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-button-secondary-text bg-button-secondary-bg hover:bg-button-secondary-bg-hover rounded-lg transition-colors"
          >
            Cancel
          </button>
          {updateType === UPDATE_TYPE.ABSOLUTE ? (
            <button
              onClick={handleUpdate}
              className="px-4 py-2 text-sm font-medium text-text-white bg-button-primary-bg hover:bg-button-primary-bg-hover rounded-lg transition-colors"
            >
              Set
            </button>
          ) : (
            <>
              <button
                onClick={handleRemove}
                className="px-4 py-2 text-sm font-medium text-text-white bg-button-danger-bg hover:bg-button-danger-bg-hover rounded-lg transition-colors"
              >
                Remove
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 text-sm font-medium text-text-white bg-button-success-bg hover:bg-button-success-bg-hover rounded-lg transition-colors"
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
