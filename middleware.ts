import { withAuth } from "next-auth/middleware"
import { hasResourceAccess, hasUserManagementAccess } from './lib/discord-roles'

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      if (!token) {
        return false
      }

      const { pathname } = req.nextUrl
      const userRoles = (token.userRoles as string[]) || []

      if (pathname.startsWith('/users') || pathname.startsWith('/api/users')) {
        return hasUserManagementAccess(userRoles)
      }

      return hasResourceAccess(userRoles)
    },
  },
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/resources/:path*',
    '/users/:path*',
    '/api/resources/:path*',
    '/api/user/:path*',
    '/api/users/:path*',
    '/api/internal/:path*',
  ],
}