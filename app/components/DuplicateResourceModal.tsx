"use client";

import { useState, useEffect } from "react";
import {
  CATEGORY_OPTIONS,
  TIER_OPTIONS,
  SUBCATEGORY_OPTIONS,
} from "@/lib/constants";

interface Resource {
  id: string;
  name: string;
  category?: string;
  subcategory?: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  multiplier?: number;
  isPriority?: boolean;
  tier?: number;
  targetQuantity?: number;
}

interface DuplicateResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newResourceId: string) => void;
  resource: Resource | null;
}

export function DuplicateResourceModal({
  isOpen,
  onClose,
  onSuccess,
  resource,
}: DuplicateResourceModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    category: "Raw",
    subcategory: null as string | null,
    tier: null as number | null,
    icon: "",
    imageUrl: "",
    description: "",
    multiplier: 1.0,
    targetQuantity: null as number | null,
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
      const timer = setTimeout(() => setShowModal(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && resource) {
      setFormData({
        name: resource.name + " (Copy)",
        category: resource.category ?? "Raw",
        subcategory: resource.subcategory ?? null,
        tier: resource.tier ?? null,
        icon: resource.icon ?? "",
        imageUrl: resource.imageUrl ?? "",
        description: resource.description ?? "",
        multiplier: resource.multiplier ?? 1.0,
        targetQuantity: resource.targetQuantity ?? null,
        isPriority: resource.isPriority ?? false,
      });
      setError(null);
      setSaving(false);
    }
  }, [isOpen, resource]);

  const handleSubmit = async () => {
    if (!resource) return;

    if (!formData.name) {
      setError("Name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          subcategory: formData.subcategory,
          tier: formData.tier,
          icon: formData.icon || null,
          imageUrl: formData.imageUrl,
          description: formData.description,
          multiplier: formData.multiplier,
          targetQuantity: formData.targetQuantity,
          isPriority: formData.isPriority,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create resource");
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
      onSuccess(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
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
        aria-labelledby="duplicate-resource-modal-title"
        className={`mx-4 w-full max-w-lg transform rounded-lg border border-border-secondary bg-background-modal-content p-6 transition-all duration-300 ease-in-out md:p-8 lg:max-w-xl ${
          isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3
            id="duplicate-resource-modal-title"
            className="text-lg font-semibold text-text-primary"
          >
            Duplicate {resource.name}
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
              htmlFor="dup-name-input"
              className="mb-1 block text-sm font-medium text-text-secondary"
            >
              Name *
            </label>
            <input
              id="dup-name-input"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full rounded-lg border border-border-secondary bg-background-modal-content-inset px-3 py-2 text-text-primary"
            />
          </div>

          <div>
            <label
              htmlFor="dup-category-select"
              className="mb-1 block text-sm font-medium text-text-secondary"
            >
              Category
            </label>
            <select
              id="dup-category-select"
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value,
                  subcategory: null,
                })
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
              htmlFor="dup-subcategory-select"
              className="mb-1 block text-sm font-medium text-text-secondary"
            >
              Subcategory
            </label>
            <select
              id="dup-subcategory-select"
              value={formData.subcategory ?? ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  subcategory: e.target.value || null,
                })
              }
              className="w-full rounded-lg border border-border-secondary bg-background-modal-content-inset px-3 py-2 text-text-primary"
            >
              <option value="">None</option>
              {SUBCATEGORY_OPTIONS[formData.category]?.map((subcat) => (
                <option key={subcat} value={subcat}>
                  {subcat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="dup-tier-select"
              className="mb-1 block text-sm font-medium text-text-secondary"
            >
              Tier
            </label>
            <select
              id="dup-tier-select"
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
              htmlFor="dup-icon-input"
              className="mb-1 block text-sm font-medium text-text-secondary"
            >
              Icon{" "}
              <span className="font-normal text-text-quaternary">
                (emoji or identifier)
              </span>
            </label>
            <input
              id="dup-icon-input"
              type="text"
              value={formData.icon}
              onChange={(e) =>
                setFormData({ ...formData, icon: e.target.value })
              }
              className="w-full rounded-lg border border-border-secondary bg-background-modal-content-inset px-3 py-2 text-text-primary"
            />
          </div>

          <div>
            <label
              htmlFor="dup-image-url-input"
              className="mb-1 block text-sm font-medium text-text-secondary"
            >
              Image URL
            </label>
            <input
              id="dup-image-url-input"
              type="url"
              value={formData.imageUrl}
              onChange={(e) =>
                setFormData({ ...formData, imageUrl: e.target.value })
              }
              className="w-full rounded-lg border border-border-secondary bg-background-modal-content-inset px-3 py-2 text-text-primary"
            />
          </div>

          <div>
            <label
              htmlFor="dup-description-textarea"
              className="mb-1 block text-sm font-medium text-text-secondary"
            >
              Description
            </label>
            <textarea
              id="dup-description-textarea"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full rounded-lg border border-border-secondary bg-background-modal-content-inset px-3 py-2 text-text-primary"
              rows={3}
            />
          </div>

          <div>
            <label
              htmlFor="dup-multiplier-input"
              className="mb-1 block text-sm font-medium text-text-secondary"
            >
              Points Multiplier
            </label>
            <input
              id="dup-multiplier-input"
              type="number"
              step="0.1"
              min="0"
              value={formData.multiplier}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setFormData({
                  ...formData,
                  multiplier: isNaN(val) ? 1.0 : val,
                });
              }}
              className="w-full rounded-lg border border-border-secondary bg-background-modal-content-inset px-3 py-2 text-text-primary"
            />
          </div>

          <div>
            <label
              htmlFor="dup-target-quantity-input"
              className="mb-1 block text-sm font-medium text-text-secondary"
            >
              Target Quantity{" "}
              <span className="font-normal text-text-quaternary">(optional)</span>
            </label>
            <input
              id="dup-target-quantity-input"
              type="number"
              min="0"
              value={formData.targetQuantity ?? ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  targetQuantity: e.target.value
                    ? parseInt(e.target.value)
                    : null,
                })
              }
              className="w-full rounded-lg border border-border-secondary bg-background-modal-content-inset px-3 py-2 text-text-primary"
            />
          </div>

          <div className="flex items-center">
            <input
              id="dup-isPriority"
              type="checkbox"
              checked={formData.isPriority}
              onChange={(e) =>
                setFormData({ ...formData, isPriority: e.target.checked })
              }
              className="h-4 w-4 rounded border-border-secondary text-text-link focus:ring-blue-500"
            />
            <label
              htmlFor="dup-isPriority"
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
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-lg bg-button-primary-bg px-4 py-2 text-sm font-medium text-text-white transition-colors hover:bg-button-primary-bg-hover disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Duplicate"}
          </button>
        </div>
      </div>
    </div>
  );
}
