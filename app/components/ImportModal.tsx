"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function ImportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [diff, setDiff] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handlePreview = async () => {
    if (!file) {
      setError("Please select a file.");
      return;
    }

    setLoading(true);
    setError(null);
    setDiff(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/resources/bulk", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setDiff(data);
      } else {
        const err = await response.json();
        setError(err.error || "Failed to preview data.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!diff) return;

    setLoading(true);
    try {
      const response = await fetch("/api/resources/bulk/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(diff.filter(d => d.status === "changed")),
      });

      if (response.ok) {
        onClose();
        window.location.reload();
      } else {
        const err = await response.json();
        setError(err.error || "Failed to import data.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-overlay">
      <div className="mx-4 max-w-2xl w-full rounded-lg border border-border-primary bg-background-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Import CSV</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-background-secondary">
            <X className="h-5 w-5 text-text-secondary" />
          </button>
        </div>

        {!diff ? (
          <div>
            <p className="mb-4 text-text-secondary">
              Upload a CSV file to update resource quantities and targets. The CSV must contain &apos;id&apos;, &apos;quantityHagga&apos;, &apos;quantityDeepDesert&apos;, and &apos;targetQuantity&apos; columns.
            </p>
            <input type="file" accept=".csv" onChange={handleFileChange} className="mb-4 w-full rounded-lg border border-border-secondary bg-background-panel-inset px-3 py-2 text-text-primary" />
            <button onClick={handlePreview} disabled={!file || loading} className="w-full rounded-lg bg-button-primary-bg px-4 py-2 text-sm font-medium text-text-white transition-colors hover:bg-button-primary-bg-hover disabled:opacity-50">
              {loading ? "Previewing..." : "Preview Changes"}
            </button>
          </div>
        ) : (
          <div>
            <h4 className="font-semibold mb-2">Previewing Changes</h4>
            <div className="max-h-64 overflow-y-auto border border-border-secondary rounded-lg">
              <table className="min-w-full divide-y divide-border-primary">
                <thead className="bg-background-secondary">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-text-quaternary uppercase">Resource</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-text-quaternary uppercase">Field</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-text-quaternary uppercase">Old Value</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-text-quaternary uppercase">New Value</th>
                  </tr>
                </thead>
                <tbody className="bg-background-panel divide-y divide-border-primary">
                  {diff.filter(d => d.status === 'changed').flatMap((d) =>
                    Object.keys(d.new).map(key => ({...d, field: key}))
                  ).map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2">{item.name}</td>
                      <td className="px-4 py-2">{item.field}</td>
                      <td className="px-4 py-2">{item.old[item.field]}</td>
                      <td className="px-4 py-2 font-semibold text-text-success">{item.new[item.field]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setDiff(null)} className="rounded-lg bg-button-secondary-bg px-4 py-2 text-sm font-medium text-button-secondary-text transition-colors hover:bg-button-secondary-bg-hover">Back</button>
              <button onClick={handleConfirm} disabled={loading} className="rounded-lg bg-button-success-bg px-4 py-2 text-sm font-medium text-text-white transition-colors hover:bg-button-success-bg-hover disabled:opacity-50">
                {loading ? "Importing..." : "Confirm Import"}
              </button>
            </div>
          </div>
        )}
        {error && <p className="mt-4 text-sm text-text-danger">{error}</p>}
      </div>
    </div>
  );
}
