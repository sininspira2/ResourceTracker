import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * NextAuth.js catch-all route handler.
 *
 * Handles all authentication requests under `/api/auth/**` (sign-in, sign-out,
 * callbacks, session, CSRF token, etc.) by delegating to the NextAuth handler
 * configured in `lib/auth.ts`.
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
