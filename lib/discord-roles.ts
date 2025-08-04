// Types for role configuration
type RoleConfig = {
  id: string;
  name: string;
  level: number;
  isAdmin?: boolean;
  canEditTargets?: boolean;
  canAccessResources?: boolean;
}

// Parse the JSON role configuration from environment variable
function parseRoleConfig(): RoleConfig[] {
  try {
    const roleConfig = process.env.DISCORD_ROLES_CONFIG
    if (!roleConfig) {
      console.warn('No DISCORD_ROLES_CONFIG found, using empty configuration')
      return []
    }
    
    // Log the raw value for debugging (first 100 chars only)
    console.log('DISCORD_ROLES_CONFIG raw value:', roleConfig.substring(0, 100) + (roleConfig.length > 100 ? '...' : ''))
    
    const parsed = JSON.parse(roleConfig)
    
    // Validate that it's an array
    if (!Array.isArray(parsed)) {
      console.error('DISCORD_ROLES_CONFIG must be an array, got:', typeof parsed)
      return []
    }
    
    // Validate each role object
    const validRoles = parsed.filter(role => {
      if (!role || typeof role !== 'object') {
        console.warn('Invalid role object:', role)
        return false
      }
      if (!role.id || !role.name) {
        console.warn('Role missing required fields (id, name):', role)
        return false
      }
      return true
    })
    
    console.log(`Successfully parsed ${validRoles.length} valid roles`)
    return validRoles
    
  } catch (error) {
    console.error('Failed to parse DISCORD_ROLES_CONFIG:', error)
    console.error('Raw value length:', process.env.DISCORD_ROLES_CONFIG?.length || 0)
    console.error('Raw value preview:', process.env.DISCORD_ROLES_CONFIG?.substring(0, 200) + '...')
    console.log('Expected format: [{"id":"123","name":"Role","level":1,"canAccessResources":true}]')
    return []
  }
}

// Discord role hierarchy from environment configuration
const ROLE_HIERARCHY = parseRoleConfig()

// Specific admin roles that can edit/delete/create resources
const RESOURCE_ADMIN_ROLES = ROLE_HIERARCHY
  .filter(role => role.isAdmin)
  .map(role => role.id)

// Admin roles that can edit target quantities
const TARGET_ADMIN_ROLES = ROLE_HIERARCHY
  .filter(role => role.canEditTargets)
  .map(role => role.id)

// Roles that can access the resource management system
const RESOURCE_ACCESS_ROLES = ROLE_HIERARCHY
  .filter(role => role.canAccessResources)
  .map(role => role.id)

// Helper function to get role information by ID
export function getRoleInfo(roleId: string) {
  return ROLE_HIERARCHY.find(role => role.id === roleId)
}

// Helper function to get role name by ID
export function getRoleName(roleId: string): string {
  const role = getRoleInfo(roleId)
  return role ? role.name : `Unknown Role (${roleId})`
}

// Helper function to get the highest role a user has
export function getHighestRole(userRoles: string[]) {
  let highestRole = null
  let highestLevel = 0

  for (const roleId of userRoles) {
    const role = getRoleInfo(roleId)
    if (role && role.level > highestLevel) {
      highestLevel = role.level
      highestRole = role
    }
  }

  return highestRole
}

// Helper function to get all hierarchy roles a user has (sorted by level descending)
export function getHierarchyRoles(userRoles: string[]): Array<RoleConfig> {
  return userRoles
    .map(roleId => getRoleInfo(roleId))
    .filter((role): role is RoleConfig => role !== undefined)
    .sort((a, b) => b.level - a.level)
}



// Helper function to check if user has resource access
export function hasResourceAccess(userRoles: string[]): boolean {
  // Temporary fix: if no roles are configured, allow access for any user with roles
  if (RESOURCE_ACCESS_ROLES.length === 0 && userRoles.length > 0) {
    console.log('DEBUG: No roles configured, allowing access for user with roles:', userRoles)
    return true
  }
  return userRoles.some(role => RESOURCE_ACCESS_ROLES.includes(role))
}

// Helper function to check if user has resource admin access (edit/delete/create)
export function hasResourceAdminAccess(userRoles: string[]): boolean {
  // Temporary fix: if no roles are configured, allow admin access for any user with roles
  if (RESOURCE_ADMIN_ROLES.length === 0 && userRoles.length > 0) {
    console.log('DEBUG: No admin roles configured, allowing admin access for user with roles:', userRoles)
    return true
  }
  return userRoles.some(role => RESOURCE_ADMIN_ROLES.includes(role))
}

// Helper function to check if user has admin access for target editing
export function hasTargetEditAccess(userRoles: string[]): boolean {
  // Temporary fix: if no roles are configured, allow target edit access for any user with roles
  if (TARGET_ADMIN_ROLES.length === 0 && userRoles.length > 0) {
    console.log('DEBUG: No target edit roles configured, allowing target edit access for user with roles:', userRoles)
    return true
  }
  return userRoles.some(role => TARGET_ADMIN_ROLES.includes(role))
}