"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { FaDiscord } from "react-icons/fa";

// This is a shared component, assuming it exists. If not, I'll create it.
import AuthButton from "@/app/components/AuthButton";

export default function SignInPage() {
  const [level, setLevel] = useState("1");
  const isDevelopment = process.env.NODE_ENV === "development";

  const handleAgentSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    signIn("credentials", {
      permissionLevel: level,
      callbackUrl: "/dashboard",
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
      <div className="w-full max-w-md rounded-lg bg-gray-800 p-8 shadow-2xl">
        <h1 className="mb-6 text-center text-3xl font-bold">Sign In</h1>
        <p className="mb-8 text-center text-gray-400">
          Sign in with your Discord account to continue.
        </p>

        {/* Standard Discord Sign-In */}
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

        {/* Development-Only Agent Sign-In */}
        {isDevelopment && (
          <div className="mt-8 border-t border-gray-700 pt-8">
            <h2 className="mb-4 text-center text-xl font-semibold">
              For Development
            </h2>
            <form onSubmit={handleAgentSignIn}>
              <div className="mb-4">
                <label
                  htmlFor="permissionLevel"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  Agent Permission Level
                </label>
                <select
                  id="permissionLevel"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="1">Level 1: Contributor</option>
                  <option value="2">Level 2: Logistics</option>
                  <option value="3">Level 3: Manager</option>
                  <option value="4">Level 4: Admin</option>
                </select>
              </div>
              <AuthButton
                type="submit"
                className="w-full !bg-indigo-600 hover:!bg-indigo-700"
              >
                {`Sign in as Agent (Level ${level})`}
              </AuthButton>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
