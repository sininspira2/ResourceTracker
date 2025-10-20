import React from "react";
import { cn } from "@/lib/utils";

interface AuthButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

export function AuthButton({
  onClick,
  children,
  className = "",
}: AuthButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-text-white transition-colors",
        className,
      )}
    >
      {children}
    </button>
  );
}
