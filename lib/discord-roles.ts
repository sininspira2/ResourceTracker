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
    return JSON.parse(roleConfig)
  } catch (error) {
    console.error('Failed to parse DISCORD_ROLES_CONFIG:', error)
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
  return userRoles.some(role => RESOURCE_ACCESS_ROLES.includes(role))
}

// Helper function to check if user has resource admin access (edit/delete/create)
export function hasResourceAdminAccess(userRoles: string[]): boolean {
  return userRoles.some(role => RESOURCE_ADMIN_ROLES.includes(role))
}

// Helper function to check if user has admin access for target editing
export function hasTargetEditAccess(userRoles: string[]): boolean {
  return userRoles.some(role => TARGET_ADMIN_ROLES.includes(role))
}