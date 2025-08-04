import { withAuth } from "next-auth/middleware"
import { hasResourceAccess } from './lib/discord-roles'
 
// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/resources',
  '/api/resources',
  '/api/user',
]

export default withAuth(
  function middleware(req) {
    // Additional middleware logic can go here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow public routes
        if (!protectedRoutes.some(route => pathname.startsWith(route))) {
          return true
        }
        
        // Check if user has valid token and required roles
        if (token?.userRoles && hasResourceAccess(token.userRoles as string[])) {
          return true
        }
        
        return false
      },
    },
  }
)

export const config = {
  matcher: ['/dashboard/:path*', '/resources/:path*']
} 