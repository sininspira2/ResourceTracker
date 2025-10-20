"use client";

import { signOut } from "next-auth/react";
import { AuthButton } from "./AuthButton";
import { cn } from "@/lib/utils";

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

  return (
    <AuthButton
      onClick={handleSignOut}
      className={cn("bg-button-danger-bg hover:bg-button-danger-bg-hover", {
        "px-6 py-3 font-semibold": variant === "prominent",
        "w-full": fullWidth,
      })}
    >
      {variant === "prominent"
        ? "Sign Out & Try Different Account"
        : "Sign Out"}
    </AuthButton>
  );
}
