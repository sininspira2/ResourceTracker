"use client";

import { useState, useMemo } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// The original DiffItem is kept for the API response,
// but the component will use the much simpler DiffRowItem
interface DiffItem {
  id: string;
  name: string;
  status: "changed" | "invalid" | "unchanged" | "not_found";
  old?: {
    quantityHagga: number;
    quantityDeepDesert: number;
    targetQuantity: number | null;
    [key: string]: number | null;
  };
  new?: {
    quantityHagga?: number | string;
    quantityDeepDesert?: number | string;
    targetQuantity?: number | null | string;
    [key: string]: number | null | string | undefined;
  };
  errors?: {
    quantityHagga?: string;
    quantityDeepDesert?: string;
    targetQuantity?: string;
    [key: string]: string | undefined;
  };
}

// A flatter, more explicit type for rendering the preview table
interface DiffRowItem {
  id: string;
  name: string;
  status: "changed" | "invalid";
  field: "quantityHagga" | "quantityDeepDesert" | "targetQuantity";
  oldValue: number | null;
  newValue: number | string | null;
  error?: string;
}

export function ImportModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [diff, setDiff] = useState<DiffItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
        setError("Invalid file type. Please upload a .csv file.");
        setFile(null);
        return;
      }

      if (selectedFile.size / 1024 > 256) {
        setError("File size exceeds the 256KB limit.");
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError(null);
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
        body: JSON.stringify(diff.filter((d) => d.status === "changed")),
      });

      if (response.ok) {
        onClose();
        router.refresh();
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

  const hasInvalidEntries = useMemo(
    () => diff?.some((d) => d.status === "invalid"),
    [diff],
  );

  const diffTableRows = useMemo((): DiffRowItem[] => {
    if (!diff) return [];
    return diff.flatMap((d) => {
      const rows: DiffRowItem[] = [];
      if (d.status === "changed" && d.old && d.new) {
        Object.keys(d.new).forEach((key) => {
          const field = key as DiffRowItem["field"];
          rows.push({
            id: d.id,
            name: d.name,
            status: "changed",
            field,
            oldValue: d.old?.[field] ?? null,
            newValue: d.new?.[field] ?? null,
          });
        });
      }
      if (d.status === "invalid" && d.errors && d.old && d.new) {
        Object.keys(d.errors).forEach((key) => {
          const field = key as DiffRowItem["field"];
          rows.push({
            id: d.id,
            name: d.name,
            status: "invalid",
            field,
            oldValue: d.old?.[field] ?? null,
            newValue: d.new?.[field] ?? null,
            error: d.errors?.[field],
          });
        });
      }
      return rows;
    });
  }, [diff]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-overlay">
      <div className="mx-4 w-full max-w-4xl rounded-lg border border-border-primary bg-background-panel p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary">
            Import CSV
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-background-secondary"
          >
            <X className="h-5 w-5 text-text-secondary" />
          </button>
        </div>

        {!diff ? (
          <div>
            <label htmlFor="csv-upload" className="mb-4 text-text-secondary">
              Upload a CSV file to update resource quantities and targets. The
              CSV must contain &apos;id&apos;, &apos;quantityHagga&apos;,
              &apos;quantityDeepDesert&apos;, and &apos;targetQuantity&apos;
              columns.
            </label>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="mb-4 w-full rounded-lg border border-border-secondary bg-background-panel-inset px-3 py-2 text-text-primary"
            />
            <button
              onClick={handlePreview}
              disabled={!file || loading}
              className="w-full rounded-lg bg-button-primary-bg px-4 py-2 text-sm font-medium text-text-white transition-colors hover:bg-button-primary-bg-hover disabled:opacity-50"
            >
              {loading ? "Previewing..." : "Preview Changes"}
            </button>
          </div>
        ) : (
          <div>
            <h4 className="mb-2 font-semibold text-text-primary">
              Previewing Changes
            </h4>
            {hasInvalidEntries && (
              <div className="mb-4 rounded-lg bg-background-warning-subtle p-3">
                <p className="font-bold text-text-warning-strong">
                  Your import has invalid entries that must be fixed before you
                  can proceed.
                </p>
              </div>
            )}
            <div className="max-h-96 overflow-y-auto rounded-lg border border-border-secondary">
              <table className="min-w-full divide-y divide-border-primary">
                <thead className="bg-background-secondary">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium tracking-wider text-text-secondary uppercase">
                      Resource
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium tracking-wider text-text-secondary uppercase">
                      Field
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium tracking-wider text-text-secondary uppercase">
                      Old Value
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium tracking-wider text-text-secondary uppercase">
                      New Value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-primary bg-background-panel">
                  {diffTableRows.map((item) => (
                    <tr
                      key={`${item.id}-${item.field}`}
                      className={cn(
                        "hover:bg-background-secondary",
                        item.status === "invalid" &&
                          "bg-background-warning-subtle hover:bg-background-warning-subtle-hover",
                      )}
                    >
                      <td className="px-4 py-2 text-text-secondary">
                        {item.name}
                      </td>
                      <td className="px-4 py-2 text-text-secondary">
                        {item.field}
                      </td>
                      <td className="px-4 py-2 text-text-secondary">
                        {item.oldValue ?? "N/A"}
                      </td>
                      <td
                        className={`px-4 py-2 font-semibold ${item.status === "invalid" ? "text-text-danger" : "text-text-success"}`}
                      >
                        {item.newValue ?? "N/A"}
                        {item.error && (
                          <p className="text-xs font-normal text-text-danger">
                            {item.error}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setDiff(null)}
                className="rounded-lg bg-button-secondary-bg px-4 py-2 text-sm font-medium text-button-secondary-text transition-colors hover:bg-button-secondary-bg-hover"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading || hasInvalidEntries}
                className="rounded-lg bg-button-success-bg px-4 py-2 text-sm font-medium text-text-white transition-colors hover:bg-button-success-bg-hover disabled:opacity-50"
              >
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
