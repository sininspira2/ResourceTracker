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

  const hasInvalidEntries = diff?.some((d) => d.status === "invalid");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-overlay">
      <div className="w-full max-w-4xl mx-4 p-6 rounded-lg border border-border-primary bg-background-panel">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Import CSV</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-background-secondary">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {!diff ? (
          <div>
            <p className="mb-4 text-text-secondary">
              Upload a CSV file to update resource quantities and targets. The CSV must contain &apos;id&apos;, &apos;quantityHagga&apos;, &apos;quantityDeepDesert&apos;, and &apos;targetQuantity&apos; columns.
            </p>
            <input type="file" accept=".csv" onChange={handleFileChange} className="w-full px-3 py-2 mb-4 rounded-lg border border-border-secondary bg-background-panel-inset text-text-primary" />
            <button onClick={handlePreview} disabled={!file || loading} className="w-full px-4 py-2 text-sm font-medium text-text-white rounded-lg bg-button-primary-bg hover:bg-button-primary-bg-hover disabled:opacity-50 transition-colors">
              {loading ? "Previewing..." : "Preview Changes"}
            </button>
          </div>
        ) : (
          <div>
            <h4 className="mb-2 font-semibold text-text-primary">Previewing Changes</h4>
            {hasInvalidEntries && (
              <div className="p-3 mb-4 rounded-lg bg-background-warning text-text-warning">
                <p className="font-semibold">Your import has invalid entries that must be fixed before you can proceed.</p>
              </div>
            )}
            <div className="overflow-y-auto border rounded-lg max-h-96 border-border-secondary">
              <table className="min-w-full divide-y divide-border-primary">
                <thead className="bg-background-secondary">
                  <tr>
                    <th className="px-4 py-2 text-xs font-medium tracking-wider text-left uppercase text-text-secondary">Resource</th>
                    <th className="px-4 py-2 text-xs font-medium tracking-wider text-left uppercase text-text-secondary">Field</th>
                    <th className="px-4 py-2 text-xs font-medium tracking-wider text-left uppercase text-text-secondary">Old Value</th>
                    <th className="px-4 py-2 text-xs font-medium tracking-wider text-left uppercase text-text-secondary">New Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y bg-background-panel divide-border-primary">
                  {diff.flatMap((d) =>
                    d.status === 'changed'
                      ? Object.keys(d.new).map(key => ({ ...d, field: key }))
                      : d.status === 'invalid'
                        ? Object.keys(d.errors).map(key => ({ ...d, field: key, error: d.errors[key] }))
                        : []
                  ).map((item, index) => (
                    <tr key={index} className={`hover:bg-background-secondary ${item.status === 'invalid' ? 'bg-background-warning' : ''}`}>
                      <td className="px-4 py-2 text-text-secondary">{item.name}</td>
                      <td className="px-4 py-2 text-text-secondary">{item.field}</td>
                      <td className="px-4 py-2 text-text-secondary">{item.old[item.field]}</td>
                      <td className={`px-4 py-2 font-semibold ${item.status === 'invalid' ? 'text-text-danger' : 'text-text-success'}`}>
                        {item.new[item.field]}
                        {item.error && <p className="text-xs font-normal text-text-danger">{item.error}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setDiff(null)} className="px-4 py-2 text-sm font-medium rounded-lg bg-button-secondary-bg text-button-secondary-text hover:bg-button-secondary-bg-hover transition-colors">Back</button>
              <button onClick={handleConfirm} disabled={loading || hasInvalidEntries} className="px-4 py-2 text-sm font-medium text-text-white rounded-lg bg-button-success-bg hover:bg-button-success-bg-hover disabled:opacity-50 transition-colors">
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
