"use client";

import { signIn } from "next-auth/react";
import { FaDiscord } from "react-icons/fa";
import AuthButton from "./AuthButton";

const LoginButton = () => {
  return (
    <AuthButton
      className="mx-auto"
      onClick={() =>
        signIn("discord", {
          callbackUrl: "/dashboard",
        })
      }
      icon={<FaDiscord className="mr-3 h-6 w-6" />}
    >
      <span className="whitespace-nowrap">Sign in with Discord</span>
    </AuthButton>
  );
};

export default LoginButton;
