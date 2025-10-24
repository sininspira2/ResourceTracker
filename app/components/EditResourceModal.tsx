"use client";

import { useState, useEffect } from "react";
import { CATEGORY_OPTIONS } from "@/lib/constants";

const TIER_OPTIONS = [
  { value: "0", label: "Tier 0 (Scrap)" },
  { value: "1", label: "Tier 1 (Copper)" },
  { value: "2", label: "Tier 2 (Iron)" },
  { value: "3", label: "Tier 3 (Steel)" },
  { value: "4", label: "Tier 4 (Aluminum)" },
  { value: "5", label: "Tier 5 (Duraluminum)" },
  { value: "6", label: "Tier 6 (Plastanium)" },
];

interface Resource {
  id: string;
  name: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  multiplier?: number;
  isPriority?: boolean;
  tier?: number;
}

interface EditResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (resourceId: string, data: any) => Promise<void>;
  resource: Resource | null;
}

export function EditResourceModal({
  isOpen,
  onClose,
  onSave,
  resource,
}: EditResourceModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    category: "Raw",
    tier: null as number | null,
    description: "",
    imageUrl: "",
    multiplier: 1.0,
    isPriority: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
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
    if (isOpen && resource) {
      setFormData({
        name: resource.name,
        category: resource.category || "Raw",
        tier: resource.tier ?? null,
        description: resource.description || "",
        imageUrl: resource.imageUrl || "",
        multiplier: resource.multiplier || 1.0,
        isPriority: resource.isPriority || false,
      });
      setError(null);
      setSaving(false);
    }
  }, [isOpen, resource]);

  const handleSave = async () => {
    if (!resource) return;

    if (!formData.name) {
      setError("Name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave(resource.id, formData);
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  if (!showModal || !resource) return null;

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
        aria-labelledby="edit-resource-modal-title"
        className={`mx-4 w-full max-w-lg transform rounded-lg border border-border-secondary bg-background-modal-content p-6 transition-all duration-300 ease-in-out md:p-8 lg:max-w-xl ${
          isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3
            id="edit-resource-modal-title"
            className="text-lg font-semibold text-text-primary"
          >
            Edit {resource.name}
          </h3>
          <button
            onClick={onClose}
            className="text-text-quaternary hover:text-text-tertiary"
            disabled={saving}
          >
            <svg
              className="h-6 w-6"
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

        <div className="space-y-4">
          <div>
            <label
              htmlFor="name-input"
              className="mb-1 block text-sm font-medium text-text-secondary"
            >
              Name *
            </label>
            <input
              id="name-input"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              onKeyDown={handleKeyDown}
              className="w-full rounded-lg border border-border-secondary bg-background-modal-content-inset px-3 py-2 text-text-primary"
            />
          </div>

          <div>
            <label
              htmlFor="category-select"
              className="mb-1 block text-sm font-medium text-text-secondary"
            >
              Category
            </label>
            <select
              id="category-select"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full rounded-lg border border-border-secondary bg-background-modal-content-inset px-3 py-2 text-text-primary"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="tier-select"
              className="mb-1 block text-sm font-medium text-text-secondary"
            >
              Tier
            </label>
            <select
              id="tier-select"
              value={formData.tier ?? ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tier: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              className="w-full rounded-lg border border-border-secondary bg-background-modal-content-inset px-3 py-2 text-text-primary"
            >
              <option value="">None</option>
              {TIER_OPTIONS.map((tier) => (
                <option key={tier.value} value={tier.value}>
                  {tier.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="description-textarea"
              className="mb-1 block text-sm font-medium text-text-secondary"
            >
              Description
            </label>
            <textarea
              id="description-textarea"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full rounded-lg border border-border-secondary bg-background-modal-content-inset px-3 py-2 text-text-primary"
              rows={4}
            />
          </div>

          <div>
            <label
              htmlFor="image-url-input"
              className="mb-1 block text-sm font-medium text-text-secondary"
            >
              Image URL
            </label>
            <input
              id="image-url-input"
              type="url"
              value={formData.imageUrl}
              onChange={(e) =>
                setFormData({ ...formData, imageUrl: e.target.value })
              }
              onKeyDown={handleKeyDown}
              className="w-full rounded-lg border border-border-secondary bg-background-modal-content-inset px-3 py-2 text-text-primary"
            />
          </div>

          <div>
            <label
              htmlFor="multiplier-input"
              className="mb-1 block text-sm font-medium text-text-secondary"
            >
              Points Multiplier
            </label>
            <input
              id="multiplier-input"
              type="number"
              step="0.1"
              min="0"
              value={formData.multiplier}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  multiplier: parseFloat(e.target.value) || 1.0,
                })
              }
              onKeyDown={handleKeyDown}
              className="w-full rounded-lg border border-border-secondary bg-background-modal-content-inset px-3 py-2 text-text-primary"
            />
          </div>

          <div className="flex items-center">
            <input
              id="isPriority"
              type="checkbox"
              checked={formData.isPriority}
              onChange={(e) =>
                setFormData({ ...formData, isPriority: e.target.checked })
              }
              className="h-4 w-4 rounded border-border-secondary text-text-link focus:ring-blue-500"
            />
            <label
              htmlFor="isPriority"
              className="ml-2 block text-sm text-text-secondary"
            >
              Priority Resource
            </label>
          </div>

          {error && <p className="text-sm text-text-danger">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg bg-button-secondary-bg px-4 py-2 text-sm font-medium text-button-secondary-text transition-colors hover:bg-button-secondary-bg-hover"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-button-primary-bg px-4 py-2 text-sm font-medium text-text-white transition-colors hover:bg-button-primary-bg-hover disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
