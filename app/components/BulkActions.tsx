"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { ImportModal } from "./ImportModal";
import { ExportConfirmationModal } from "./ExportConfirmationModal";
import { HardDriveDownload, FileInput } from "lucide-react";

interface Filters {
  [key: string]: string | number | boolean | Array<string | number | boolean>;
}

export function BulkActions({
  filters,
  searchTerm,
  filteredCount,
}: {
  filters: Filters;
  searchTerm: string;
  filteredCount: number;
}) {
  const { data: session } = useSession();
  const [isImportModalOpen, setisImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [location1Name, setLocation1Name] = useState("Hagga");
  const [location2Name, setLocation2Name] = useState("Deep Desert");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/global-settings", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) return;
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.location1Name) setLocation1Name(data.location1Name);
        if (data.location2Name) setLocation2Name(data.location2Name);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          // ignore non-abort fetch errors silently
        }
      });
    return () => controller.abort();
  }, []);

  if (!session?.user?.permissions?.hasTargetEditAccess) {
    return null;
  }

  const handleExport = async () => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value != null) {
        if (Array.isArray(value)) {
          value.forEach((item) => params.append(key, String(item)));
        } else {
          params.append(key, String(value));
        }
      }
    }

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
    window.URL.revokeObjectURL(url);
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
        location1Name={location1Name}
        location2Name={location2Name}
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
