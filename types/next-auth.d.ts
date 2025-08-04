import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      roles: string[]
      isInGuild: boolean
      discordNickname?: string | null
      customNickname?: string | null
    }
  }

  interface JWT {
    accessToken?: string
    userRoles?: string[]
    isInGuild?: boolean
    rolesFetched?: boolean
    discordNickname?: string | null
  }
} 