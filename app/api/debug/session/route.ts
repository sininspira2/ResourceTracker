import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { hasResourceAccess, hasResourceAdminAccess, hasTargetEditAccess, getRoleInfo, getHierarchyRoles } from '@/lib/discord-roles'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ 
      error: 'Not authenticated',
      authenticated: false 
    })
  }

  const userRoles = session.user.roles || []
  
  // Get role information for each role the user has
  const roleDetails = userRoles.map(roleId => {
    const roleInfo = getRoleInfo(roleId)
    return {
      id: roleId,
      configured: !!roleInfo,
      info: roleInfo || null
    }
  })

  const debugInfo = {
    authenticated: true,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      isInGuild: session.user.isInGuild,
      discordNickname: session.user.discordNickname
    },
    roles: {
      raw: userRoles,
      count: userRoles.length,
      details: roleDetails,
      hierarchy: getHierarchyRoles(userRoles)
    },
    permissions: {
      hasResourceAccess: hasResourceAccess(userRoles),
      hasResourceAdminAccess: hasResourceAdminAccess(userRoles),
      hasTargetEditAccess: hasTargetEditAccess(userRoles)
    },
    environment: {
      guildId: process.env.DISCORD_GUILD_ID,
      rolesConfigSet: !!process.env.DISCORD_ROLES_CONFIG,
      rolesConfigLength: process.env.DISCORD_ROLES_CONFIG?.length || 0,
      nodeEnv: process.env.NODE_ENV
    }
  }

  return NextResponse.json(debugInfo, {
    headers: {
      'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate'
    }
  })
}