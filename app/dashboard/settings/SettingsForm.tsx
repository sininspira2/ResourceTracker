"use client";

import { useState, useEffect } from "react";
import { useLocationNames } from "@/app/context/LocationNamesContext";

export function SettingsForm() {
  const { refreshLocationNames } = useLocationNames();
  const [location1Name, setLocation1Name] = useState("Hagga");
  const [location2Name, setLocation2Name] = useState("Deep Desert");
  const [loading, setLoading] = useState(true);
  const [loadWarning, setLoadWarning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/global-settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.location1Name && data?.location2Name) {
          setLocation1Name(data.location1Name);
          setLocation2Name(data.location2Name);
        } else {
          setLoadWarning(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoadWarning(true);
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/global-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location1Name, location2Name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to save settings");
      } else {
        setSuccess(true);
        await refreshLocationNames();
      }
    } catch {
      setError("Network error, please try again");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-border-primary bg-background-secondary p-6">
        <p className="text-text-tertiary">Loading settings...</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-border-primary bg-background-secondary p-6"
    >
      <h2 className="mb-1 text-xl font-semibold text-text-primary">
        Inventory Location Names
      </h2>
      <p className="mb-6 text-sm text-text-tertiary">
        Customize the display names for the two inventory locations shown throughout the app.
      </p>

      {loadWarning && (
        <div className="mb-4 rounded-md bg-background-warning p-3 text-sm text-text-warning">
          Could not load current settings — showing defaults. You can still save new values.
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label
            htmlFor="location1-input"
            className="mb-1 block text-sm font-medium text-text-secondary"
          >
            Location 1 Name
          </label>
          <input
            id="location1-input"
            type="text"
            value={location1Name}
            onChange={(e) => setLocation1Name(e.target.value)}
            maxLength={50}
            required
            className="w-full rounded-lg border border-border-secondary bg-background-primary px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Hagga"
          />
        </div>

        <div>
          <label
            htmlFor="location2-input"
            className="mb-1 block text-sm font-medium text-text-secondary"
          >
            Location 2 Name
          </label>
          <input
            id="location2-input"
            type="text"
            value={location2Name}
            onChange={(e) => setLocation2Name(e.target.value)}
            maxLength={50}
            required
            className="w-full rounded-lg border border-border-secondary bg-background-primary px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Deep Desert"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-background-danger p-3 text-sm text-text-danger">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-md bg-background-success p-3 text-sm text-text-success">
          Settings saved successfully. Changes are now reflected across the app.
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={saving || !location1Name.trim() || !location2Name.trim()}
          className="rounded-lg bg-button-primary-bg px-6 py-2 text-sm font-medium text-text-white transition-colors hover:bg-button-primary-bg-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
