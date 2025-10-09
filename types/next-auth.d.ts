import "next-auth";
import "next-auth/jwt";

// This is the shape of the permissions object computed server-side
// and attached to the session and JWT token.
interface UserPermissions {
  hasResourceAccess: boolean;
  hasResourceAdminAccess: boolean;
  hasTargetEditAccess: boolean;
  hasReportAccess: boolean;
  hasUserManagementAccess: boolean;
  hasDataExportAccess: boolean;
}

declare module "next-auth" {
  /**
   * Extends the built-in session.user object to include the custom properties
   * we are adding in the auth.ts callbacks.
   */
  interface User {
    roles?: string[];
    isInGuild?: boolean;
    discordNickname?: string | null;
    permissions?: UserPermissions;
    global_name?: string | null;
  }

  interface Session {
    user: User & {
      roles: string[];
      isInGuild: boolean;
      discordNickname: string | null;
      permissions: UserPermissions;
    };
  }
}

declare module "next-auth/jwt" {
  /**
   * Extends the built-in JWT token to include the custom properties
   * we are adding in the auth.ts callbacks.
   */
  interface JWT {
    userRoles?: string[];
    isInGuild?: boolean;
    discordNickname?: string | null;
    permissions?: UserPermissions;
    rolesFetched?: boolean;
    accessToken?: string;
    global_name?: string;
  }
}
