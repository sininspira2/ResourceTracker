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
      <div className="w-full max-w-md mx-4 p-6 rounded-lg border border-border-primary bg-background-panel">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export CSV
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-background-secondary"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>
        <div className="text-center">
          <p className="text-text-primary text-lg mb-2">
            Export {resourceCount} resources?
          </p>
          <p className="text-text-secondary text-sm mb-6">
            Resources are exported to a CSV file based on the filters applied
            to the resource table.
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-button-secondary-bg text-button-secondary-text hover:bg-button-secondary-bg-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-text-white rounded-lg bg-button-success-bg hover:bg-button-success-bg-hover transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
