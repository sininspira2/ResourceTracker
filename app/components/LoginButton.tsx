"use client";

import { signIn } from "next-auth/react";
import { AuthButton } from "./AuthButton";
import { FaDiscord } from "react-icons/fa";

export function LoginButton() {
  return (
    <AuthButton
      onClick={() => signIn("discord", { callbackUrl: "/dashboard" })}
      className="mx-auto gap-2 bg-button-login-bg font-semibold hover:bg-button-login-bg-hover"
    >
      <FaDiscord className="h-5 w-5" />
      Sign in with Discord
    </AuthButton>
  );
}