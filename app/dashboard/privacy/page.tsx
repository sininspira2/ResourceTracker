"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
// Note: hasResourceAccess now computed server-side and available in session.user.permissions
import { getDisplayName } from "@/lib/auth";

export default function PrivacyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [requestingDeletion, setRequestingDeletion] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    if (status === "loading") {
      return;
    }

    if (
      status === "authenticated" &&
      (!session || !session.user?.permissions?.hasResourceAccess)
    ) {
      router.push("/");
      return;
    }
  }, [session, status, router]);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const downloadData = async () => {
    setDownloading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/user/data-export", {
        method: "GET",
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        // Use the filename from the response headers
        const contentDisposition = response.headers.get("Content-Disposition");
        const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
        const filename = filenameMatch
          ? filenameMatch[1]
          : `silver-portal-data-${new Date().toISOString().split("T")[0]}.json`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setMessage({
          type: "success",
          text: "Your data has been downloaded successfully!",
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage({
          type: "error",
          text: errorData.error || "Failed to download data. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error downloading data:", error);
      setMessage({
        type: "error",
        text: "An error occurred while downloading your data.",
      });
    } finally {
      setDownloading(false);
    }
  };

  const requestDataDeletion = async () => {
    const confirmationMessage =
      "Are you sure you want to request deletion of your data? This action will anonymize all your resource change history and cannot be undone.";
    if (!confirm(confirmationMessage)) {
      return;
    }

    setRequestingDeletion(true);
    setMessage(null);
    try {
      const response = await fetch("/api/user/data-deletion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        setMessage({
          type: "success",
          text: `Data deletion request processed successfully. ${result.recordsAffected} records were anonymized.`,
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage({
          type: "error",
          text:
            errorData.error ||
            "Failed to submit deletion request. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error requesting data deletion:", error);
      setMessage({
        type: "error",
        text: "An error occurred while submitting your deletion request.",
      });
    } finally {
      setRequestingDeletion(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="bg-background-primary flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-text-link mx-auto h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="text-text-tertiary mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  const displayName = session ? getDisplayName(session.user) : "User";

  return (
    <div className="bg-background-primary min-h-screen transition-colors duration-300">
      {/* Header */}
      <div className="bg-background-secondary border-border-primary border-b shadow-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-text-tertiary hover:text-text-primary flex items-center transition-colors"
              >
                <ArrowLeft className="h-5 w-5 sm:mr-2" />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </Link>
              <div className="bg-border-secondary h-6 w-px"></div>
              <h1 className="text-text-primary text-xl font-semibold">
                Privacy & Data
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Welcome */}
          <div className="text-center">
            <h1 className="text-text-primary mb-4 text-3xl font-bold">
              Privacy & Data Management
            </h1>
            <p className="text-text-tertiary text-lg">
              Welcome, {displayName}. Manage your personal data and privacy
              settings.
            </p>
          </div>

          {/* Message Display */}
          {message && (
            <div
              className={`rounded-lg p-4 ${
                message.type === "success"
                  ? "bg-background-success border-border-success text-text-success border"
                  : "bg-background-danger border-border-danger text-text-danger border"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Data Rights Overview */}
          <div className="bg-background-panel border-border-primary rounded-lg border p-6 shadow-sm">
            <h2 className="text-text-primary mb-4 text-xl font-semibold">
              Your Data Rights
            </h2>
            <p className="text-text-tertiary mb-6">
              Under GDPR and other privacy regulations, you have certain rights
              regarding your personal data.
              {process.env.NEXT_PUBLIC_ORG_NAME || "Resource Tracker"} is
              committed to protecting your privacy and giving you control over
              your information.
            </p>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="border-border-secondary bg-background-panel-inset rounded-lg border p-4">
                <h3 className="text-text-primary mb-2 font-semibold">
                  🔍 Right to Access
                </h3>
                <p className="text-text-tertiary mb-3 text-sm">
                  Download all data we have about you, including your resource
                  change history, Discord information, and account settings.
                </p>
                <button
                  onClick={downloadData}
                  disabled={downloading}
                  className="bg-button-primary-bg hover:bg-button-primary-bg-hover text-text-white w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {downloading ? "Preparing Download..." : "Download My Data"}
                </button>
              </div>

              <div className="border-border-secondary bg-background-panel-inset rounded-lg border p-4">
                <h3 className="text-text-primary mb-2 font-semibold">
                  🗑️ Right to Erasure
                </h3>
                <p className="text-text-tertiary mb-3 text-sm">
                  Request anonymization of your personal data. This will remove
                  your resource change history but preserve anonymized
                  statistics.
                </p>
                <button
                  onClick={requestDataDeletion}
                  disabled={requestingDeletion}
                  className="bg-button-danger-bg hover:bg-button-danger-bg-hover text-text-white w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {requestingDeletion
                    ? "Processing..."
                    : "Request Data Deletion"}
                </button>
              </div>
            </div>
          </div>

          {/* Data We Collect */}
          <div className="bg-background-panel border-border-primary rounded-lg border p-6 shadow-sm">
            <h2 className="text-text-primary mb-4 text-xl font-semibold">
              Data We Collect
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-text-primary font-medium">
                  Discord Authentication Data
                </h3>
                <p className="text-text-tertiary text-sm">
                  Your Discord username, server nickname, profile picture, and
                  server roles (managed by Discord&apos;s privacy policy).
                </p>
              </div>
              <div>
                <h3 className="text-text-primary font-medium">
                  Resource Activity
                </h3>
                <p className="text-text-tertiary text-sm">
                  Records of resource quantity changes you make, including
                  timestamps, change amounts, and your display name at the time
                  of change.
                </p>
              </div>
              <div>
                <h3 className="text-text-primary font-medium">Session Data</h3>
                <p className="text-text-tertiary text-sm">
                  Temporary session tokens for authentication (automatically
                  expire after 4 hours for enhanced security).
                </p>
              </div>
            </div>
          </div>

          {/* Data Retention */}
          <div className="bg-background-panel border-border-primary rounded-lg border p-6 shadow-sm">
            <h2 className="text-text-primary mb-4 text-xl font-semibold">
              Data Retention
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-text-primary font-medium">
                  Resource Activity History
                </h3>
                <p className="text-text-tertiary text-sm">
                  Retained indefinitely to maintain resource management
                  integrity, unless you request deletion.
                </p>
              </div>
              <div>
                <h3 className="text-text-primary font-medium">
                  Session Tokens
                </h3>
                <p className="text-text-tertiary text-sm">
                  Automatically deleted after 4 hours of inactivity.
                </p>
              </div>
              <div>
                <h3 className="text-text-primary font-medium">
                  Discord Profile Information
                </h3>
                <p className="text-text-tertiary text-sm">
                  Refreshed on each login from Discord&apos;s servers. Not
                  permanently stored.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-background-info border-border-info rounded-lg border p-6">
            <h2 className="text-version-tag-text mb-2 text-lg font-semibold">
              Need Help?
            </h2>
            <p className="text-button-subtle-blue-text text-sm">
              If you have questions about your data or need assistance with
              privacy-related requests, please contact the server administrators
              through Discord.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
