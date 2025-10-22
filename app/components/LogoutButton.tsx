"use client";

import { signOut } from "next-auth/react";
import AuthButton from "./AuthButton";

type LogoutButtonProps = {
  variant?: "default" | "prominent";
  fullWidth?: boolean;
};

const LogoutButton = ({
  variant = "default",
  fullWidth = false,
}: LogoutButtonProps) => {
  const text =
    variant === "prominent"
      ? "Sign Out & Try Different Account"
      : "Sign Out";

  return (
    <AuthButton
      onClick={() => signOut({ callbackUrl: "/" })}
      className={fullWidth ? "w-full" : ""}
    >
      {text}
    </AuthButton>
  );
};

export default LogoutButton;
