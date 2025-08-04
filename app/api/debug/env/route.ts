import { NextResponse } from 'next/server'

export async function GET() {
  const envVars = {
    DISCORD_ROLES_CONFIG: {
      exists: !!process.env.DISCORD_ROLES_CONFIG,
      length: process.env.DISCORD_ROLES_CONFIG?.length || 0,
      value: process.env.DISCORD_ROLES_CONFIG?.substring(0, 200) || 'undefined',
      parsed: null as any
    },
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL
  }

  // Try to parse the DISCORD_ROLES_CONFIG
  if (process.env.DISCORD_ROLES_CONFIG) {
    try {
      envVars.DISCORD_ROLES_CONFIG.parsed = JSON.parse(process.env.DISCORD_ROLES_CONFIG)
    } catch (error) {
      envVars.DISCORD_ROLES_CONFIG.parsed = { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  return NextResponse.json(envVars)
} 