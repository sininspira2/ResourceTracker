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
      className="text-xs text-text-quaternary hover:text-text-link transition-colors cursor-pointer px-2 py-1 rounded-sm hover:bg-background-tertiary"
      title="Click to view changelog"
      data-testid="version-display"
    >
      v{version}
    </button>
  );
}
