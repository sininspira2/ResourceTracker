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
        className={`bg-button-danger-bg hover:bg-button-danger-bg-hover text-text-white rounded-lg px-6 py-3 font-semibold transition-colors ${
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
      className="bg-button-danger-bg hover:bg-button-danger-bg-hover text-text-white rounded-lg px-4 py-2 transition-colors"
    >
      Sign Out
    </button>
  );
}
