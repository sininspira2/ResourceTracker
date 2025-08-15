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

// Cached roles to avoid re-parsing on every function call.
// This is intentionally a module-level variable to cache the config during the
// lifetime of a serverless function invocation.
let cachedRoles: RoleConfig[] | null = null;

/**
 * Parses the role configuration from the DISCORD_ROLES_CONFIG environment variable.
 * This function uses memoization (caching) to avoid re-parsing the JSON on every call.
 *
 * IMPORTANT: It only caches a SUCCESSFUL parse. If the environment variable is missing
 * or invalid, it returns an empty array for the current call but does not cache the
 * result. This allows subsequent calls within the same warm serverless function to
 * retry parsing, which is crucial if environment variables are loaded with a slight delay.
 */
function getRoleHierarchy(): RoleConfig[] {
  // If we have a valid, cached configuration, return it immediately.
  if (cachedRoles !== null) {
    return cachedRoles;
  }

  const roleConfig = process.env.DISCORD_ROLES_CONFIG;

  // If the environment variable is not set, log a warning and return an empty array for now.
  // We do NOT cache this result, allowing for a retry on the next call.
  if (!roleConfig) {
    console.warn('No DISCORD_ROLES_CONFIG found. Using empty configuration for this call.');
    return [];
  }

  try {
    const parsed = JSON.parse(roleConfig);

    // Validate that the parsed config is an array.
    if (!Array.isArray(parsed)) {
      console.error('DISCORD_ROLES_CONFIG must be an array, got:', typeof parsed);
      return []; // Do not cache failure
    }

    // Validate each role object in the array.
    const validRoles = parsed.filter(role => {
      if (!role || typeof role !== 'object') {
        console.warn('Invalid role object in DISCORD_ROLES_CONFIG');
        return false;
      }
      if (!role.id || !role.name) {
        console.warn('Role missing required fields (id, name) in DISCORD_ROLES_CONFIG');
        return false;
      }
      return true;
    });

    if (validRoles.length === 0 && parsed.length > 0) {
      console.warn('No valid roles found in DISCORD_ROLES_CONFIG after filtering.');
    }

    // Cache the successfully parsed and validated roles.
    cachedRoles = validRoles;
    return validRoles;

  } catch (error) {
    console.error('Failed to parse DISCORD_ROLES_CONFIG:', error instanceof Error ? error.message : 'Invalid JSON');
    console.error('Expected format: [{"id":"123","name":"Role","level":1,"canAccessResources":true}]');
    return []; // Do not cache failure
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