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
        "flex shrink-0 items-center justify-center rounded-md bg-background-tertiary px-3 py-2 font-semibold whitespace-nowrap text-text-primary transition-colors hover:bg-background-secondary sm:px-4",

        className,
      )}
      {...props}
    >
      {icon}
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
};

export default AuthButton;
