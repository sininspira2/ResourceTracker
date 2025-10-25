import { NextResponse } from "next/server";
import { getRoleHierarchy } from "@/lib/discord-roles";

// Define the structure of a Discord role object
type DiscordRole = {
  id: string;
  name: string;
  color: number;
  position: number;
};

// Define the structure of the enriched role object we'll return
export type EnrichedRole = {
  id: string;
  name: string;
  color: number;
  permissions: string[];
};

// Function to get a friendly name for a permission key
function getPermissionName(key: string): string {
  switch (key) {
    case "canAccessResources":
      return "View Resources";
    case "canEditTargets":
      return "Edit Targets";
    case "canManageUsers":
      return "Manage Users";
    case "canExportData":
      return "Export Data";
    case "isAdmin":
      return "Administrator";
    case "canViewReports":
      return "View Reports";
    default:
      return key; // Return the key itself if no mapping is found
  }
}

/**
 * API route to get an enriched list of Discord roles for the guild.
 *
 * This route fetches all roles from the Discord API for the configured guild.
 * It then cross-references this list with the application's internal role
 * hierarchy (defined in `DISCORD_ROLES_CONFIG`) to determine which permissions
 * each role grants.
 *
 * The final output is an array of `EnrichedRole` objects, which include the
 * role's ID, name, color, and a user-friendly list of its permissions.
 *
 * This endpoint is protected by middleware to ensure only authenticated users
 * can access it.
 */
export async function GET() {
  const guildId = process.env.DISCORD_GUILD_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  // Validate that necessary environment variables are set
  if (!guildId || !botToken) {
    console.error("Missing DISCORD_GUILD_ID or DISCORD_BOT_TOKEN");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  try {
    // Fetch the list of roles from the Discord API
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/roles`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
        next: {
          // Revalidate the data every hour (3600 seconds)
          revalidate: 3600,
        },
      },
    );

    // Handle non-successful responses from the Discord API
    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Discord API error: ${response.status} ${response.statusText}`,
        errorText,
      );
      return NextResponse.json(
        { error: "Failed to fetch roles from Discord" },
        { status: 502 }, // 502 Bad Gateway is appropriate here
      );
    }

    const discordRoles: DiscordRole[] = await response.json();

    // Get the application's internal role hierarchy
    const appRoles = getRoleHierarchy();

    // Create a map for quick lookup of application roles by ID
    const appRolesMap = new Map(appRoles.map((role) => [role.id, role]));

    // Enrich the Discord roles with permission information from our config
    const enrichedRoles: EnrichedRole[] = discordRoles
      .map((discordRole) => {
        const appRole = appRolesMap.get(discordRole.id);
        if (!appRole) {
          // If the role exists on Discord but not in our config, skip it
          return null;
        }

        // Determine the list of permissions for this role
        const permissions: string[] = [];
        for (const [key, value] of Object.entries(appRole)) {
          // We only care about boolean flags that are set to true
          if (typeof value === "boolean" && value) {
            permissions.push(getPermissionName(key));
          }
        }

        // If the role has permissions, add it to our list
        if (permissions.length > 0) {
          return {
            id: discordRole.id,
            name: discordRole.name,
            color: discordRole.color,
            permissions: permissions.sort(), // Sort for consistent order
          };
        }

        return null;
      })
      .filter((role): role is EnrichedRole => role !== null)
      // Sort the final list by position (highest role first)
      .sort((a, b) => {
        const roleA = discordRoles.find((r) => r.id === a.id)!.position;
        const roleB = discordRoles.find((r) => r.id === b.id)!.position;
        return roleB - roleA;
      });

    return NextResponse.json(enrichedRoles);
  } catch (error) {
    console.error("Error fetching or processing Discord roles:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
