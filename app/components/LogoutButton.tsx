"use client";

import { signOut } from "next-auth/react";
import { AuthButton } from "./AuthButton";

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
      <AuthButton
        onClick={handleSignOut}
        className={`bg-button-danger-bg px-6 py-3 font-semibold hover:bg-button-danger-bg-hover ${
          fullWidth ? "w-full" : ""
        }`}
      >
        Sign Out & Try Different Account
      </AuthButton>
    );
  }

  return (
    <AuthButton
      onClick={handleSignOut}
      className="bg-button-danger-bg hover:bg-button-danger-bg-hover"
    >
      Sign Out
    </AuthButton>
  );
}