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
      className="text-text-quaternary hover:text-text-link hover:bg-background-tertiary cursor-pointer rounded-sm px-2 py-1 text-xs transition-colors"
      title="Click to view changelog"
      data-testid="version-display"
    >
      v{version}
    </button>
  );
}
