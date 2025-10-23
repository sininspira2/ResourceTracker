"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { ImportModal } from "./ImportModal";
import { ExportConfirmationModal } from "./ExportConfirmationModal";
import { HardDriveDownload, FileInput } from "lucide-react";

export function BulkActions({
  filters,
  searchTerm,
  filteredCount,
}: {
  filters: any;
  searchTerm: string;
  filteredCount: number;
}) {
  const { data: session } = useSession();
  const [isImportModalOpen, setisImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  if (!session?.user?.permissions?.hasTargetEditAccess) {
    return null;
  }

  const handleExport = async () => {
    const params = new URLSearchParams(filters);
    if (searchTerm) {
      params.append("searchTerm", searchTerm);
    }
    const response = await fetch(`/api/resources/bulk?${params.toString()}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resources.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setIsExportModalOpen(false);
  };

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => setIsExportModalOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-button-secondary-bg px-4 py-2 text-sm font-medium text-button-secondary-text transition-colors hover:bg-button-secondary-bg-hover"
      >
        <HardDriveDownload className="h-4 w-4" />
        Export CSV
      </button>
      <button
        onClick={() => setisImportModalOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-button-primary-bg px-4 py-2 text-sm font-medium text-text-white transition-colors hover:bg-button-primary-bg-hover"
      >
        <FileInput className="h-4 w-4" />
        Import CSV
      </button>
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setisImportModalOpen(false)}
      />
      <ExportConfirmationModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onConfirm={handleExport}
        resourceCount={filteredCount}
      />
    </div>
  );
}
