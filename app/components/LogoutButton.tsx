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
        className={`bg-button-danger-bg hover:bg-button-danger-bg-hover text-text-white px-6 py-3 rounded-lg transition-colors font-semibold ${
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
      className="bg-button-danger-bg hover:bg-button-danger-bg-hover text-text-white px-4 py-2 rounded-lg transition-colors"
    >
      Sign Out
    </button>
  );
}
