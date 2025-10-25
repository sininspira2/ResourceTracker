import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { getRoleHierarchy } from "@/lib/discord-roles";

// Define the structure of a Discord Role object
interface DiscordRole {
  id: string;
  name: string;
}

/**
 * @swagger
 * /api/internal/discord-roles:
 *   get:
 *     summary: Fetches all roles from the configured Discord guild and the local role hierarchy
 *     description: |
 *       Retrieves a list of all roles from the Discord guild specified by `DISCORD_GUILD_ID`
 *       and the application's internal role hierarchy configuration.
 *       This endpoint requires the user to be authenticated. It uses the user's OAuth2 access
 *       token obtained during login to communicate with the Discord API.
 *     tags:
 *       - Discord
 *     responses:
 *       200:
 *         description: A successful response.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 discordRoles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                 roleHierarchy:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RoleConfig' # Assuming a RoleConfig schema is defined
 *       401:
 *         description: Unauthorized. The user is not authenticated or the access token is missing.
 *       500:
 *         description: Internal Server Error. Failed to fetch roles from Discord API or missing configuration.
 */
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.accessToken) {
    return NextResponse.json(
      { error: "Unauthorized: Missing access token" },
      { status: 401 },
    );
  }

  const guildId = process.env.DISCORD_GUILD_ID;
  if (!guildId) {
    console.error("DISCORD_GUILD_ID is not set.");
    return NextResponse.json(
      { error: "Server configuration error." },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/roles`,
      {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
        },
        next: {
          revalidate: 3600, // Cache for 1 hour
        },
      },
    );

    if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401 || response.status === 403) {
             console.error("Discord API authentication error:", errorData);
             return NextResponse.json(
               { error: "Invalid Discord token. Please sign out and sign back in." },
               { status: 401 },
             );
        }
      console.error(
        `Failed to fetch Discord roles: ${response.status} ${response.statusText}`,
        errorData
      );
      return NextResponse.json(
        { error: "Failed to fetch Discord roles from the API." },
        { status: response.status },
      );
    }

    const discordRoles: DiscordRole[] = await response.json();
    const roleHierarchy = getRoleHierarchy();

    return NextResponse.json({ discordRoles, roleHierarchy });
  } catch (error) {
    console.error("Error fetching Discord roles:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
