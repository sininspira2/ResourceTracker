"use client";

import { cn } from "@/lib/utils";
import React from "react";

type AuthButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: React.ReactNode;
};

const AuthButton = ({
  className,
  icon,
  children,
  ...props
}: AuthButtonProps) => {
  return (
    <button
      className={cn(
        "flex w-full items-center justify-center rounded-md bg-gray-700 px-4 py-3 font-semibold text-white transition-colors hover:bg-gray-600",
        className,
      )}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
};

export default AuthButton;
