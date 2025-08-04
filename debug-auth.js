// Debug script to check authentication configuration
console.log('=== NEXTAUTH DEBUG ===\n')

// Check required environment variables
const requiredVars = [
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET', 
  'DISCORD_GUILD_ID',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET'
]

console.log('1. Environment Variables:')
requiredVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: Set (${varName.includes('SECRET') ? '***hidden***' : value})`)
  } else {
    console.log(`❌ ${varName}: NOT SET`)
  }
})

console.log('\n2. NEXTAUTH_URL Validation:')
const nextAuthUrl = process.env.NEXTAUTH_URL
if (nextAuthUrl) {
  console.log(`Current value: ${nextAuthUrl}`)
  
  // Check if it ends with a slash (shouldn't)
  if (nextAuthUrl.endsWith('/')) {
    console.log('⚠️  WARNING: NEXTAUTH_URL should not end with a slash')
  }
  
  // Check if it matches current environment
  if (nextAuthUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
    console.log('⚠️  WARNING: Using localhost URL in production')
  }
  
  // Expected callback URL
  console.log(`Expected Discord callback URL: ${nextAuthUrl}/api/auth/callback/discord`)
} else {
  console.log('❌ NEXTAUTH_URL not set')
}

console.log('\n3. NextAuth Secret:')
const secret = process.env.NEXTAUTH_SECRET
if (secret) {
  console.log(`✅ NEXTAUTH_SECRET is set (length: ${secret.length})`)
  if (secret.length < 32) {
    console.log('⚠️  WARNING: NEXTAUTH_SECRET should be at least 32 characters long')
  }
} else {
  console.log('❌ NEXTAUTH_SECRET not set')
  console.log('Generate one with: openssl rand -base64 32')
}

console.log('\n4. Current Environment:')
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`)
console.log(`Port: ${process.env.PORT || '3000'}`)

console.log('\n5. Cookie Settings Check:')
console.log(`Secure cookies: ${process.env.NODE_ENV === 'production' ? 'YES (production)' : 'NO (development)'}`)
console.log(`SameSite policy: lax`)

console.log('\n6. Common Issues & Solutions:')
console.log('- Make sure Discord app callback URL matches NEXTAUTH_URL/api/auth/callback/discord')
console.log('- Clear browser cookies and try again')
console.log('- Ensure NEXTAUTH_URL does not end with a slash')
console.log('- Check that all environment variables are properly loaded')
console.log('- Verify Discord app is configured correctly')