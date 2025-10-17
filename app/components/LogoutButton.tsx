"use client";

import { signOut } from "next-auth/react";

interface LogoutButtonProps {
  variant?: "default" | "prominent";
  fullWidth?: boolean;
}

export function LogoutButton({
  variant = "default",
  fullWidth = false,
}: LogoutButtonProps) {
  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  if (variant === "prominent") {
    return (
      <button
        onClick={handleSignOut}
        className={`rounded-lg bg-button-danger-bg px-6 py-3 font-semibold text-text-white transition-colors hover:bg-button-danger-bg-hover ${
          fullWidth ? "w-full" : ""
        }`}
      >
        Sign Out & Try Different Account
      </button>
    );
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-lg bg-button-danger-bg px-4 py-2 text-text-white transition-colors hover:bg-button-danger-bg-hover"
    >
      Sign Out
    </button>
  );
}
