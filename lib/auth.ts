import { NextAuthOptions } from "next-auth"
import DiscordProvider from "next-auth/providers/discord"
import { Session } from "next-auth"

// Discord API scopes needed for role checking
const scopes = ['identify', 'guilds.members.read'].join(' ')

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: scopes } },
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 4 * 60 * 60, // 4 hours in seconds
    updateAge: 30 * 60,  // Update session every 30 minutes
  },
  jwt: {
    maxAge: 4 * 60 * 60, // 4 hours in seconds
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.callback-url' : 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' ? '__Host-next-auth.csrf-token' : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, trigger }) {
      // Store access token from initial login
      if (account) {
        token.accessToken = account.access_token
        // Mark that we need to fetch roles on the next session call
        token.rolesFetched = false
      }

      // Fetch Discord roles and nickname on login or when explicitly triggered
      if (token.accessToken && (!token.rolesFetched || trigger === 'update')) {
        try {
          const guildId = process.env.DISCORD_GUILD_ID!
          const response = await fetch(
            `https://discord.com/api/v10/users/@me/guilds/${guildId}/member`,
            {
              headers: {
                Authorization: `Bearer ${token.accessToken}`,
              },
            }
          )
          
          if (response.ok) {
            const member = await response.json()
            token.userRoles = member.roles || []
            token.isInGuild = true
            // Prioritize nickname over username
            token.discordNickname = member.nick || null
            
            // Log member data in development only
            if (process.env.NODE_ENV === 'development') {
              console.log('Discord member data:', { 
                nick: member.nick, 
                username: member.user?.username,
                global_name: member.user?.global_name 
              })
            }
          } else {
            console.warn('Failed to fetch Discord member data:', response.status, response.statusText)
            token.userRoles = []
            token.isInGuild = false
            token.discordNickname = null
          }
        } catch (error) {
          console.error('Error fetching Discord roles and nickname:', error)
          token.userRoles = []
          token.isInGuild = false
          token.discordNickname = null
        }
        
        // Mark roles as fetched to prevent future API calls (unless explicitly triggered)
        token.rolesFetched = true
      }

      return token
    },
    async session({ session, token }) {
      // Simply use the cached data from JWT token
      session.user = {
        ...session.user,
        roles: (token.userRoles || []) as string[],
        isInGuild: Boolean(token.isInGuild),
        discordNickname: token.discordNickname as string | null
      }

      return session
    },
  },
  // Remove custom sign-in page for now to avoid conflicts
  // pages: {
  //   signIn: '/auth/signin',
  // },
}

// Helper function to check if user has specific role
export function hasRole(userRoles: string[], requiredRole: string): boolean {
  return userRoles.includes(requiredRole)
}

// Helper function to check if user has any of the required roles
export function hasAnyRole(userRoles: string[], requiredRoles: string[]): boolean {
  return requiredRoles.some(role => userRoles.includes(role))
}

// Helper function to get the best display name for a user
export function getDisplayName(user: { 
  name?: string | null
  discordNickname?: string | null
}): string {
  // Priority: Discord nickname > Discord username > fallback
  if (user.discordNickname) return user.discordNickname
  if (user.name) return user.name
  return 'Unknown User'
}

// Helper function to get user identifier for database tracking
export function getUserIdentifier(session: Session): string {
  // Priority: Discord nickname > Discord username > email > id > fallback
  if (session.user.discordNickname) return session.user.discordNickname
  if (session.user.name) return session.user.name
  if (session.user.email) return session.user.email
  if (session.user.id) return session.user.id
  return 'unknown'
} 