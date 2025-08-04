#!/usr/bin/env node

/**
 * Validate DISCORD_ROLES_CONFIG JSON
 * Usage: node scripts/validate-roles-config.js 'YOUR_JSON_STRING'
 * Or: node scripts/validate-roles-config.js (to check environment variable)
 */

const jsonString = process.argv[2] || process.env.DISCORD_ROLES_CONFIG;

if (!jsonString) {
  console.log('❌ No JSON provided and DISCORD_ROLES_CONFIG not set');
  console.log('\nUsage:');
  console.log('  node scripts/validate-roles-config.js \'[{"id":"123","name":"Test","level":1,"canAccessResources":true}]\'');
  console.log('  node scripts/validate-roles-config.js  # Uses DISCORD_ROLES_CONFIG env var');
  process.exit(1);
}

console.log('🔍 Validating DISCORD_ROLES_CONFIG...\n');
console.log('Raw input length:', jsonString.length);
console.log('First 100 chars:', jsonString.substring(0, 100) + (jsonString.length > 100 ? '...' : ''));
console.log('');

try {
  // Parse JSON
  const parsed = JSON.parse(jsonString);
  console.log('✅ Valid JSON structure');

  // Check if array
  if (!Array.isArray(parsed)) {
    console.log('❌ Must be an array, got:', typeof parsed);
    process.exit(1);
  }
  console.log('✅ Is an array');

  // Validate each role
  const requiredFields = ['id', 'name'];
  const optionalFields = ['level', 'isAdmin', 'canEditTargets', 'canAccessResources'];
  
  parsed.forEach((role, index) => {
    console.log(`\n📋 Role ${index + 1}:`);
    
    if (!role || typeof role !== 'object') {
      console.log(`❌ Invalid role object at index ${index}`);
      return;
    }

    // Check required fields
    requiredFields.forEach(field => {
      if (!role[field]) {
        console.log(`❌ Missing required field: ${field}`);
      } else {
        console.log(`✅ ${field}: "${role[field]}"`);
      }
    });

    // Show optional fields
    optionalFields.forEach(field => {
      if (role[field] !== undefined) {
        console.log(`✅ ${field}: ${role[field]}`);
      }
    });

    // Check permissions
    const hasAccess = role.canAccessResources === true;
    const isAdmin = role.isAdmin === true;
    const canEditTargets = role.canEditTargets === true;
    
    console.log(`   Permissions: ${hasAccess ? '🔑 Access' : '🚫 No Access'} ${isAdmin ? '👑 Admin' : ''} ${canEditTargets ? '🎯 Edit Targets' : ''}`);
  });

  console.log(`\n🎉 Configuration is valid! Found ${parsed.length} roles.`);
  
  // Generate minified version for Vercel
  const minified = JSON.stringify(parsed);
  console.log('\n📋 Minified for Vercel:');
  console.log(minified);
  
  if (minified.length > 4000) {
    console.log('\n⚠️  Warning: This configuration is quite long. Consider using fewer roles or shorter names.');
  }

} catch (error) {
  console.log('❌ JSON Parse Error:', error.message);
  console.log('\n🔧 Common fixes:');
  console.log('- Remove extra quotes around the entire JSON');
  console.log('- Ensure all strings are properly quoted');
  console.log('- Check for missing commas between objects/properties');
  console.log('- Ensure no trailing commas');
  console.log('- Use double quotes (") not single quotes (\')');
  
  // Try to identify the issue
  if (error.message.includes('Unexpected token')) {
    const match = error.message.match(/Unexpected token '(.+?)'/);
    if (match) {
      console.log(`\n💡 The issue appears to be with the character: "${match[1]}"`);
    }
  }
  
  process.exit(1);
}