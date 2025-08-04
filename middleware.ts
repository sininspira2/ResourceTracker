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
        
        // Allow public routes and debug endpoints
        if (!protectedRoutes.some(route => pathname.startsWith(route)) || pathname.startsWith('/api/debug')) {
          return true
        }
        
        // Check if user is authenticated first
        if (!token) {
          console.log('DEBUG: No token found, redirecting to sign-in')
          return false
        }
        
        // Check if user has required roles
        const userRoles = (token.userRoles as string[]) || []
        if (hasResourceAccess(userRoles)) {
          console.log('DEBUG: Access granted for user with roles:', userRoles)
          return true
        }
        
        console.log('DEBUG: Access denied for user with roles:', userRoles)
        return false
      },
    },
  }
)

export const config = {
  matcher: ['/dashboard/:path*', '/resources/:path*']
} 