"use client";

import { getCurrentVersion } from "@/lib/version";

interface VersionDisplayProps {
  onClick?: () => void;
}

export function VersionDisplay({ onClick }: VersionDisplayProps) {
  const version = getCurrentVersion();

  return (
    <button
      onClick={onClick}
      className="cursor-pointer rounded-sm px-2 py-1 text-xs text-text-quaternary transition-colors hover:bg-background-tertiary hover:text-text-link"
      title="Click to view changelog"
      data-testid="version-display"
    >
      v{version}
    </button>
  );
}
