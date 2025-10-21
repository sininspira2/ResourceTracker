import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { Session } from "next-auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  hasResourceAccess,
  hasResourceAdminAccess,
  hasTargetEditAccess,
  hasReportAccess,
  hasUserManagementAccess,
  hasDataExportAccess,
} from "./discord-roles";

interface UserPermissions {
  hasResourceAccess: boolean;
  hasResourceAdminAccess: boolean;
  hasTargetEditAccess: boolean;
  hasReportAccess: boolean;
  hasUserManagementAccess: boolean;
  hasDataExportAccess: boolean;
}

// Discord API scopes needed for role checking
const scopes = ["identify", "guilds.members.read"].join(" ");

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: scopes } },
      profile(profile) {
        let image_url: string;
        if (profile.avatar === null) {
          // Discord's new default avatar is based on user ID.
          // https://discord.com/developers/docs/reference#image-formatting
          const defaultAvatarNumber =
            (BigInt(profile.id) >> BigInt(22)) % BigInt(6);
          image_url = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`;
        } else {
          const format = profile.avatar.startsWith("a_") ? "gif" : "png";
          image_url = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`;
        }
        return {
          id: profile.id,
          name: profile.username,
          email: profile.email,
          image: image_url,
          global_name: profile.global_name,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 4 * 60 * 60, // 4 hours in seconds
    updateAge: 30 * 60, // Update session every 30 minutes
  },
  jwt: {
    maxAge: 4 * 60 * 60, // 4 hours in seconds
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.callback-url"
          : "next-auth.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Host-next-auth.csrf-token"
          : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, trigger, user }) {
      // Store access token and global_name from initial login
      if (account && user) {
        token.accessToken = account.access_token;
        if (user.global_name) token.global_name = user.global_name;
        token.rolesFetched = false; // Mark that we need to fetch roles on the next session call
        return token; // Return early on initial sign-in
      }

      // Fetch Discord roles and nickname on subsequent session checks or when explicitly triggered
      if (token.accessToken && (!token.rolesFetched || trigger === "update")) {
        try {
          const guildId = process.env.DISCORD_GUILD_ID!;
          const response = await fetch(
            `https://discord.com/api/v10/users/@me/guilds/${guildId}/member`,
            {
              headers: {
                Authorization: `Bearer ${token.accessToken}`,
              },
            },
          );

          if (response.ok) {
            const member = await response.json();
            token.userRoles = member.roles || [];
            token.isInGuild = true;
            // Prioritize nickname over username
            token.discordNickname = member.nick || null;

            // Log member data in development only
            if (process.env.NODE_ENV === "development") {
              console.log("Discord member data:", {
                nick: member.nick,
                username: member.user?.username,
                global_name: member.user?.global_name,
              });
            }

            // Upsert user data in the database
            if (token.sub) {
              // token.sub is the user's Discord ID
              const discordId = token.sub;
              const username = token.name || "unknown";
              const avatar = token.picture || null;
              // Use server nickname if available, otherwise fall back to global name
              const displayName = member.nick || token.global_name || username;

              const now = new Date();

              try {
                await db
                  .insert(users)
                  .values({
                    id: nanoid(),
                    discordId: discordId,
                    username: username,
                    avatar: avatar,
                    customNickname: displayName,
                    createdAt: now,
                    lastLogin: now,
                  })
                  .onConflictDoUpdate({
                    target: users.discordId,
                    set: {
                      username: username,
                      avatar: avatar,
                      customNickname: displayName,
                      lastLogin: now,
                    },
                  });
              } catch (dbError) {
                console.error("Database user upsert failed:", dbError);
              }
            }
          } else {
            console.warn(
              "Failed to fetch Discord member data:",
              response.status,
              response.statusText,
            );
            token.userRoles = [];
            token.isInGuild = false;
            token.discordNickname = null;
          }
        } catch (error) {
          console.error("Error fetching Discord roles and nickname:", error);
          token.userRoles = [];
          token.isInGuild = false;
          token.discordNickname = null;
        }

        // Mark roles as fetched to prevent future API calls (unless explicitly triggered)
        token.rolesFetched = true;

        // Compute permissions server-side to avoid client-side environment variable issues
        const userRoles = (token.userRoles || []) as string[];
        token.permissions = {
          hasResourceAccess: hasResourceAccess(userRoles),
          hasResourceAdminAccess: hasResourceAdminAccess(userRoles),
          hasTargetEditAccess: hasTargetEditAccess(userRoles),
          // 🆕 Add new permission computations:
          hasReportAccess: hasReportAccess(userRoles),
          hasUserManagementAccess: hasUserManagementAccess(userRoles),
          hasDataExportAccess: hasDataExportAccess(userRoles),
        };
      }

      return token;
    },
    async session({ session, token }) {
      // Simply use the cached data from JWT token
      session.user = {
        ...session.user,
        roles: (token.userRoles || []) as string[],
        isInGuild: Boolean(token.isInGuild),
        discordNickname: (token.discordNickname as string | null) ?? null,
        // Include pre-computed permissions to avoid client-side env var issues
        permissions: (token.permissions as UserPermissions) || {
          hasResourceAccess: false,
          hasResourceAdminAccess: false,
          hasTargetEditAccess: false,
          hasReportAccess: false,
          hasUserManagementAccess: false,
          hasDataExportAccess: false,
        },
      };

      return session;
    },
  },
  // Remove custom sign-in page for now to avoid conflicts
  // pages: {
  //   signIn: '/auth/signin',
  // },
};

// Helper function to check if user has specific role
export function hasRole(userRoles: string[], requiredRole: string): boolean {
  return userRoles.includes(requiredRole);
}

// Helper function to check if user has any of the required roles
export function hasAnyRole(
  userRoles: string[],
  requiredRoles: string[],
): boolean {
  return requiredRoles.some((role) => userRoles.includes(role));
}

// Helper function to get the best display name for a user
export function getDisplayName(user: {
  name?: string | null;
  discordNickname?: string | null;
}): string {
  // Priority: Discord nickname > Discord username > fallback
  if (user.discordNickname) return user.discordNickname;
  if (user.name) return user.name;
  return "Unknown User";
}

// Helper function to get user identifier for database tracking
export function getUserIdentifier(session: Session): string {
  // Priority: Discord nickname > Discord username > email > id > fallback
  return (
    session.user?.discordNickname ??
    session.user?.name ??
    session.user?.email ??
    session.user?.id ??
    "unknown"
  );
}
