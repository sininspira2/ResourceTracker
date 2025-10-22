"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { ImportModal } from "./ImportModal";

export function BulkActions({ filters }: { filters: any }) {
  const { data: session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!session?.user?.permissions?.hasTargetEditAccess) {
    return null;
  }

  const handleExport = async () => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`/api/resources/bulk?${params.toString()}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resources.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleExport}
        className="rounded-lg bg-button-secondary-bg px-4 py-2 text-sm font-medium text-button-secondary-text transition-colors hover:bg-button-secondary-bg-hover"
      >
        Export CSV
      </button>
      <button
        onClick={() => setIsModalOpen(true)}
        className="rounded-lg bg-button-primary-bg px-4 py-2 text-sm font-medium text-text-white transition-colors hover:bg-button-primary-bg-hover"
      >
        Import CSV
      </button>
      <ImportModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
