import React from "react";

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
      className={`flex h-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-text-white transition-colors ${className}`}
    >
      {children}
    </button>
  );
}