// Types for role configuration
type RoleConfig = {
  id: string;
  name: string;
  level: number;
  isAdmin?: boolean;
  canEditTargets?: boolean;
  canAccessResources?: boolean;
  // 🆕 Add new permissions here:
  canViewReports?: boolean;     // Example: View analytics/reports
  canManageUsers?: boolean;     // Example: Manage user accounts
  canExportData?: boolean;      // Example: Export system data
}

// Cached roles to avoid re-parsing on every function call
let cachedRoles: RoleConfig[] | null = null;

// Parse the JSON role configuration from environment variable with memoization
function getRoleHierarchy(): RoleConfig[] {
  if (cachedRoles) {
    return cachedRoles;
  }

  try {
    const roleConfig = process.env.DISCORD_ROLES_CONFIG
    if (!roleConfig) {
      console.warn('No DISCORD_ROLES_CONFIG found, using empty configuration')
      cachedRoles = [];
      return []
    }
    
    const parsed = JSON.parse(roleConfig)
    
    if (!Array.isArray(parsed)) {
      console.error('DISCORD_ROLES_CONFIG must be an array, got:', typeof parsed)
      cachedRoles = [];
      return []
    }
    
    const validRoles = parsed.filter(role => {
      if (!role || typeof role !== 'object') {
        console.warn('Invalid role object in DISCORD_ROLES_CONFIG')
        return false
      }
      if (!role.id || !role.name) {
        console.warn('Role missing required fields (id, name) in DISCORD_ROLES_CONFIG')
        return false
      }
      return true
    })
    
    if (validRoles.length === 0) {
      console.warn('No valid roles found in DISCORD_ROLES_CONFIG')
    }
    
    cachedRoles = validRoles;
    return validRoles
    
  } catch (error) {
    console.error('Failed to parse DISCORD_ROLES_CONFIG:', error instanceof Error ? error.message : 'Invalid JSON')
    console.error('Expected format: [{"id":"123","name":"Role","level":1,"canAccessResources":true}]')
    cachedRoles = [];
    return []
  }
}

// Helper function to get role information by ID
export function getRoleInfo(roleId: string) {
  return getRoleHierarchy().find(role => role.id === roleId)
}

// Helper function to get role name by ID
export function getRoleName(roleId: string): string {
  const role = getRoleInfo(roleId)
  return role ? role.name : `Unknown Role (${roleId})`
}

// Helper function to get the highest role a user has
export function getHighestRole(userRoles: string[]) {
  let highestRole: RoleConfig | null = null
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
  const resourceAccessRoles = getRoleHierarchy()
    .filter(role => role.canAccessResources)
    .map(role => role.id)

  if (resourceAccessRoles.length === 0) {
    console.warn('DISCORD_ROLES_CONFIG not configured - no users will have access. Please configure roles.')
    return false
  }
  return userRoles.some(role => resourceAccessRoles.includes(role))
}

// Helper function to check if user has resource admin access (edit/delete/create)
export function hasResourceAdminAccess(userRoles:string[]): boolean {
  const resourceAdminRoles = getRoleHierarchy()
    .filter(role => role.isAdmin)
    .map(role => role.id)

  if (resourceAdminRoles.length === 0) {
    console.warn('No admin roles configured in DISCORD_ROLES_CONFIG - no users will have admin access.')
    return false
  }
  return userRoles.some(role => resourceAdminRoles.includes(role))
}

// Helper function to check if user has admin access for target editing
export function hasTargetEditAccess(userRoles: string[]): boolean {
  const targetAdminRoles = getRoleHierarchy()
    .filter(role => role.canEditTargets)
    .map(role => role.id)

  if (targetAdminRoles.length === 0) {
    console.warn('No target edit roles configured in DISCORD_ROLES_CONFIG - no users will have target edit access.')
    return false
  }
  return userRoles.some(role => targetAdminRoles.includes(role))
}

// 🆕 Add new permission check functions:

// Helper function to check if user can view reports
export function hasReportAccess(userRoles: string[]): boolean {
  const reportRoles = getRoleHierarchy().filter(role => role.canViewReports).map(role => role.id)
  return userRoles.some(role => reportRoles.includes(role))
}

// Helper function to check if user can manage users
export function hasUserManagementAccess(userRoles: string[]): boolean {
  const userManagementRoles = getRoleHierarchy().filter(role => role.canManageUsers).map(role => role.id)
  return userRoles.some(role => userManagementRoles.includes(role))
}

// Helper function to check if user can export data
export function hasDataExportAccess(userRoles: string[]): boolean {
  const dataExportRoles = getRoleHierarchy().filter(role => role.canExportData).map(role => role.id)
  return userRoles.some(role => dataExportRoles.includes(role))
}