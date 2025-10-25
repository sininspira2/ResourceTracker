import { DefaultSession, DefaultUser } from "next-auth";
import { EnrichedRole } from "@/lib/auth"; // Import the type from your auth file

declare module "next-auth" {
  /**
   * Extends the built-in session.user type.
   */
  interface User extends DefaultUser {
    roles: string[];
    enrichedRoles: EnrichedRole[];
    isInGuild: boolean;
    discordNickname: string | null;
    permissions: {
      hasResourceAccess: boolean;
      hasResourceAdminAccess: boolean;
      hasTargetEditAccess: boolean;
      hasReportAccess: boolean;
      hasUserManagementAccess: boolean;
      hasDataExportAccess: boolean;
    };
  }

  interface Session {
    user: User;
  }
}
