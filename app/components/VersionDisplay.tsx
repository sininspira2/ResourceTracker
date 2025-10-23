"use client";

import { getCurrentVersion } from "@/lib/version";
import { cn } from "@/lib/utils";

interface VersionDisplayProps {
  onClick?: () => void;
  className?: string;
}

export function VersionDisplay({ onClick, className }: VersionDisplayProps) {
  const version = getCurrentVersion();

  return (
    <button
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-sm px-2 py-1 text-xs text-text-quaternary transition-colors hover:bg-background-tertiary hover:text-text-link",
        className,
      )}
      title="Click to view changelog"
      data-testid="version-display"
    >
      v{version}
    </button>
  );
}
