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

// Parse the JSON role configuration from environment variable
function parseRoleConfig(): RoleConfig[] {
  try {
    const roleConfig = process.env.DISCORD_ROLES_CONFIG
    console.log('🔍 DISCORD_ROLES_CONFIG debug:')
    console.log('  - Environment variable exists:', !!roleConfig)
    console.log('  - Raw value length:', roleConfig?.length || 0)
    console.log('  - Raw value (first 200 chars):', roleConfig?.substring(0, 200) || 'undefined')
    
    if (!roleConfig) {
      console.warn('No DISCORD_ROLES_CONFIG found, using empty configuration')
      return []
    }
    
    const parsed = JSON.parse(roleConfig)
    console.log('  - JSON parsed successfully')
    console.log('  - Parsed type:', typeof parsed)
    console.log('  - Is array:', Array.isArray(parsed))
    
    // Validate that it's an array
    if (!Array.isArray(parsed)) {
      console.error('DISCORD_ROLES_CONFIG must be an array, got:', typeof parsed)
      return []
    }
    
    // Validate each role object
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
    } else {
      console.log('  - Valid roles found:', validRoles.length)
      validRoles.forEach((role, index) => {
        console.log(`    Role ${index + 1}: ${role.name} (${role.id})`)
      })
    }
    
    return validRoles
    
  } catch (error) {
    console.error('Failed to parse DISCORD_ROLES_CONFIG:', error instanceof Error ? error.message : 'Invalid JSON')
    console.error('Expected format: [{"id":"123","name":"Role","level":1,"canAccessResources":true}]')
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
  if (RESOURCE_ACCESS_ROLES.length === 0) {
    console.warn('DISCORD_ROLES_CONFIG not configured - no users will have access. Please configure roles.')
    return false
  }
  return userRoles.some(role => RESOURCE_ACCESS_ROLES.includes(role))
}

// Helper function to check if user has resource admin access (edit/delete/create)
export function hasResourceAdminAccess(userRoles: string[]): boolean {
  if (RESOURCE_ADMIN_ROLES.length === 0) {
    console.warn('No admin roles configured in DISCORD_ROLES_CONFIG - no users will have admin access.')
    return false
  }
  return userRoles.some(role => RESOURCE_ADMIN_ROLES.includes(role))
}

// Helper function to check if user has admin access for target editing
export function hasTargetEditAccess(userRoles: string[]): boolean {
  if (TARGET_ADMIN_ROLES.length === 0) {
    console.warn('No target edit roles configured in DISCORD_ROLES_CONFIG - no users will have target edit access.')
    return false
  }
  return userRoles.some(role => TARGET_ADMIN_ROLES.includes(role))
}

// 🆕 Add new permission check functions:

// Helper function to check if user can view reports
export function hasReportAccess(userRoles: string[]): boolean {
  const reportRoles = ROLE_HIERARCHY.filter(role => role.canViewReports).map(role => role.id)
  return userRoles.some(role => reportRoles.includes(role))
}

// Helper function to check if user can manage users
export function hasUserManagementAccess(userRoles: string[]): boolean {
  const userManagementRoles = ROLE_HIERARCHY.filter(role => role.canManageUsers).map(role => role.id)
  return userRoles.some(role => userManagementRoles.includes(role))
}

// Helper function to check if user can export data
export function hasDataExportAccess(userRoles: string[]): boolean {
  const dataExportRoles = ROLE_HIERARCHY.filter(role => role.canExportData).map(role => role.id)
  return userRoles.some(role => dataExportRoles.includes(role))
}