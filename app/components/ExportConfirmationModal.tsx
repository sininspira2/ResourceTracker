"use client";

import { X, Download } from "lucide-react";

interface ExportConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  resourceCount: number;
}

export function ExportConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  resourceCount,
}: ExportConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-overlay">
      <div className="mx-4 w-full max-w-md rounded-lg border border-border-primary bg-background-panel p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
            <Download className="h-5 w-5" />
            Export CSV
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-background-secondary"
          >
            <X className="h-5 w-5 text-text-secondary" />
          </button>
        </div>
        <div className="text-center">
          <p className="mb-2 text-lg text-text-primary">
            Export {resourceCount} resources?
          </p>
          <p className="mb-6 text-sm text-text-secondary">
            Resources are exported to a CSV file based on the filters applied to
            the resource table.
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg bg-button-secondary-bg px-4 py-2 text-sm font-medium text-button-secondary-text transition-colors hover:bg-button-secondary-bg-hover"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-2 rounded-lg bg-button-success-bg px-4 py-2 text-sm font-medium text-text-white transition-colors hover:bg-button-success-bg-hover"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
