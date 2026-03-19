import { withAuth } from "next-auth/middleware";
import {
  hasResourceAccess,
  hasUserManagementAccess,
} from "./lib/discord-roles";

// Define a type for the token's permissions for clarity
interface TokenPermissions {
  hasResourceAccess?: boolean;
  hasUserManagementAccess?: boolean;
}

/**
 * NextAuth middleware that enforces route-level access control.
 *
 * Applied to all routes listed in `config.matcher`. The `authorized` callback
 * checks the JWT token's `permissions` object (populated by the NextAuth JWT
 * callback) for agent-based auth, falling back to Discord role-based checks for
 * standard sessions:
 * - `/users` and `/api/users` routes require user management access
 * - All other matched routes require basic resource access
 */
export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      if (!token) {
        return false;
      }

      const { pathname } = req.nextUrl;
      const permissions = token.permissions as TokenPermissions | undefined;

      // New logic for agent-based auth (direct permissions)
      if (permissions) {
        if (
          pathname.startsWith("/users") ||
          pathname.startsWith("/api/users")
        ) {
          return permissions.hasUserManagementAccess ?? false;
        }
        return permissions.hasResourceAccess ?? false;
      }

      // Fallback to original logic for Discord-based auth (role-based)
      const userRoles = (token.userRoles as string[]) || [];
      if (pathname.startsWith("/users") || pathname.startsWith("/api/users")) {
        return hasUserManagementAccess(userRoles);
      }
      return hasResourceAccess(userRoles);
    },
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/resources/:path*",
    "/users/:path*",
    "/api/resources/:path*",
    "/api/user/:path*",
    "/api/users/:path*",
    "/api/internal/:path*",
  ],
};
