"use client";

import { signIn } from "next-auth/react";
import { FaDiscord } from "react-icons/fa";
import AuthButton from "./AuthButton";

const LoginButton = () => {
  return (
    <AuthButton
      onClick={() =>
        signIn("discord", {
          callbackUrl: "/dashboard",
        })
      }
      icon={<FaDiscord className="mr-3 h-6 w-6" />}
    >
      Sign in with Discord
    </AuthButton>
  );
};

export default LoginButton;
