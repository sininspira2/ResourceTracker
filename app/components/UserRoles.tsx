"use client";

import { useState, useEffect } from "react";
import type { EnrichedRole } from "@/app/api/internal/discord-roles/route";

type UserRolesProps = {
  userRoleIds: string[];
};

// A simple skeleton loader component
const RoleSkeleton = () => (
  <div className="space-y-2">
    <div className="h-4 w-1/2 rounded bg-background-modifier-accent-hover" />
    <div className="flex flex-wrap gap-1">
      <div className="h-4 w-16 rounded-sm bg-background-modifier-accent-hover" />
      <div className="h-4 w-20 rounded-sm bg-background-modifier-accent-hover" />
    </div>
  </div>
);

/**
 * A client component that fetches and displays a user's enriched Discord roles,
 * including their names, colors, and associated application permissions.
 */
export function UserRoles({ userRoleIds }: UserRolesProps) {
  const [roles, setRoles] = useState<EnrichedRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Abort controller to prevent memory leaks on unmount
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchRoles = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/internal/discord-roles", {
          signal,
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Failed to fetch roles (${response.status})`,
          );
        }
        const allRoles: EnrichedRole[] = await response.json();

        // Filter the fetched roles to only include those the user has
        const userRoles = allRoles.filter((role) =>
          userRoleIds.includes(role.id),
        );
        setRoles(userRoles);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Fetch error:", err);
          setError(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoles();

    // Cleanup function to abort fetch if the component unmounts
    return () => {
      controller.abort();
    };
  }, [userRoleIds]); // Re-fetch if the user's role IDs change

  if (isLoading) {
    return <RoleSkeleton />;
  }

  if (error) {
    return (
      <div>
        <div className="mb-2 rounded-lg bg-background-panel-inset p-3 text-xs text-text-tertiary">
          <strong>Note:</strong> Could not retrieve role names from Discord. To
          see full role details, ensure the{" "}
          <code className="rounded bg-background-modifier-accent px-1 py-0.5 text-xs">
            DISCORD_BOT_TOKEN
          </code>{" "}
          is set in your environment variables (e.g., in{" "}
          <code className="rounded bg-background-modifier-accent px-1 py-0.5 text-xs">
            .env.local
          </code>{" "}
          or your deployment service).
        </div>
        <div className="space-y-2">
          {userRoleIds.map((roleId) => (
            <div key={roleId} className="flex items-center justify-between">
              <span className="text-sm text-text-primary">
                Role ID: {roleId}
              </span>
              <span className="rounded-sm bg-tag-discord-role-bg px-2 py-1 text-xs text-tag-discord-role-text">
                Discord Role
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <p className="text-sm text-text-tertiary">
        No application-specific roles found.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {roles.map((role) => (
        <div
          key={role.id}
          className="rounded-md border border-border-primary bg-background-panel p-3 transition-colors"
        >
          <div className="flex items-center">
            {/* Role Color Indicator */}
            <span
              className="mr-2 h-3 w-3 flex-shrink-0 rounded-full"
              style={{
                backgroundColor: role.color
                  ? `#${role.color.toString(16).padStart(6, "0")}`
                  : "hsl(var(--text-tertiary))", // Default color
              }}
              title={`Role Color: #${role.color.toString(16).padStart(6, "0")}`}
            />
            {/* Role Name */}
            <span className="truncate font-semibold text-text-primary">
              {role.name}
            </span>
          </div>

          {/* Permissions List */}
          {role.permissions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {role.permissions.map((permission) => (
                <span
                  key={permission}
                  className="rounded-sm bg-tag-neutral-bg px-2 py-0.5 text-xs text-tag-neutral-text"
                >
                  {permission}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
