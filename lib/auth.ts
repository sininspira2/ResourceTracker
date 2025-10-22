import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";
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

// Define a type for the providers array to satisfy TypeScript
type Provider =
  | ReturnType<typeof DiscordProvider>
  | ReturnType<typeof CredentialsProvider>;

const providers: Provider[] = [
  DiscordProvider({
    clientId: process.env.DISCORD_CLIENT_ID!,
    clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    authorization: { params: { scope: scopes } },
    profile(profile) {
      let image_url: string;
      if (profile.avatar === null) {
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
];

// Add the Credentials provider only in development
if (process.env.NODE_ENV === "development") {
  providers.push(
    CredentialsProvider({
      name: "Agent Login",
      credentials: {
        permissionLevel: {
          label: "Permission Level",
          type: "number",
          placeholder: "1-4",
        },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        const level = parseInt(credentials.permissionLevel, 10);
        if (level >= 1 && level <= 4) {
          // Return a mock user object
          return {
            id: `agent-${level}`,
            name: `Agent (Level ${level})`,
            email: `agent${level}@example.com`,
          };
        }
        return null;
      },
    }),
  );
}

export const authOptions: NextAuthOptions = {
  providers,
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
      // Handle Agent Login for development
      if (account?.provider === "credentials" && user) {
        const level = Number(user.id.split("-")[1]);
        const permissions: UserPermissions = {
          hasResourceAccess: level >= 1,
          hasTargetEditAccess: level >= 2,
          hasUserManagementAccess: level >= 3,
          hasDataExportAccess: level >= 3,
          hasReportAccess: level >= 3,
          hasResourceAdminAccess: level >= 4,
        };

        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
        token.permissions = permissions;
        token.isInGuild = true; // Assume agent is in guild
        token.rolesFetched = true; // Prevent Discord role fetch
        token.discordNickname = user.name; // Use agent name as nickname
        return token;
      }

      // Store access token and global_name from initial login
      if (account && user) {
        token.accessToken = account.access_token;
        if (user.global_name) token.global_name = user.global_name;
        token.rolesFetched = false;
      }

      // Fetch Discord roles and nickname
      if (token.accessToken && (!token.rolesFetched || trigger === "update")) {
        try {
          const guildId = process.env.DISCORD_GUILD_ID!;
          const response = await fetch(
            `https://discord.com/api/v10/users/@me/guilds/${guildId}/member`,
            {
              headers: { Authorization: `Bearer ${token.accessToken}` },
            },
          );

          if (response.ok) {
            const member = await response.json();
            token.userRoles = member.roles || [];
            token.isInGuild = true;
            token.discordNickname = member.nick || null;

            if (token.sub) {
              const discordId = token.sub;
              const username = token.name || "unknown";
              const avatar = token.picture || null;
              const displayName = member.nick || token.global_name || username;
              const now = new Date();
              try {
                await db
                  .insert(users)
                  .values({
                    id: nanoid(),
                    discordId: discordId,
                    username,
                    avatar,
                    customNickname: displayName,
                    createdAt: now,
                    lastLogin: now,
                  })
                  .onConflictDoUpdate({
                    target: users.discordId,
                    set: {
                      username,
                      avatar,
                      customNickname: displayName,
                      lastLogin: now,
                    },
                  });
              } catch (dbError) {
                console.error("Database user upsert failed:", dbError);
              }
            }
          } else {
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

        token.rolesFetched = true;
        const userRoles = (token.userRoles || []) as string[];
        token.permissions = {
          hasResourceAccess: hasResourceAccess(userRoles),
          hasResourceAdminAccess: hasResourceAdminAccess(userRoles),
          hasTargetEditAccess: hasTargetEditAccess(userRoles),
          hasReportAccess: hasReportAccess(userRoles),
          hasUserManagementAccess: hasUserManagementAccess(userRoles),
          hasDataExportAccess: hasDataExportAccess(userRoles),
        };
      }

      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        roles: (token.userRoles || []) as string[],
        isInGuild: Boolean(token.isInGuild),
        discordNickname: token.discordNickname as string | null,
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
  pages: {
    signIn: "/auth/signin",
  },
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
