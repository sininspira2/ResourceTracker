const mockRoles = [
  { id: 'admin-role', name: 'Admin', level: 100, isAdmin: true, canEditTargets: true, canAccessResources: true, canManageUsers: true, canExportData: true, canViewReports: true },
  { id: 'manager-role', name: 'Logistics Manager', level: 50, canEditTargets: true, canAccessResources: true },
  { id: 'contributor-role', name: 'Contributor', level: 10, canAccessResources: true },
  { id: 'viewer-role', name: 'Viewer', level: 1, canViewReports: true },
  { id: 'no-perms-role', name: 'No Perms', level: 0 },
];

describe('Discord Role-Based Access Control', () => {
  let discordRoles: any;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules(); // Clear the module cache to get a fresh instance
    process.env = {
      ...originalEnv,
      DISCORD_ROLES_CONFIG: JSON.stringify(mockRoles),
    };
    // Require the module inside the test setup to get a fresh copy
    discordRoles = require('./discord-roles');
  });

  afterEach(() => {
    process.env = originalEnv; // Restore the original environment
  });

  describe('getRoleHierarchy', () => {
    it('should parse and return the role hierarchy from environment variables', () => {
      const hierarchy = discordRoles.getRoleHierarchy();
      expect(hierarchy).toEqual(mockRoles);
    });
  });

  describe('getHighestRole', () => {
    it('should return the role with the highest level', () => {
      const userRoles = ['contributor-role', 'manager-role'];
      const highestRole = discordRoles.getHighestRole(userRoles);
      expect(highestRole?.id).toBe('manager-role');
    });

    it('should return null if the user has no roles', () => {
      const highestRole = discordRoles.getHighestRole([]);
      expect(highestRole).toBeNull();
    });

    it('should return null if the user has roles not in the hierarchy', () => {
        const highestRole = discordRoles.getHighestRole(['unknown-role']);
        expect(highestRole).toBeNull();
    });
  });

  describe('Permission Checks', () => {
    const admin = ['admin-role'];
    const manager = ['manager-role', 'contributor-role'];
    const contributor = ['contributor-role'];
    const viewer = ['viewer-role'];
    const noPerms = ['no-perms-role'];
    const emptyRoles: string[] = [];

    test('hasResourceAccess', () => {
      expect(discordRoles.hasResourceAccess(admin)).toBe(true);
      expect(discordRoles.hasResourceAccess(manager)).toBe(true);
      expect(discordRoles.hasResourceAccess(contributor)).toBe(true);
      expect(discordRoles.hasResourceAccess(viewer)).toBe(false);
      expect(discordRoles.hasResourceAccess(noPerms)).toBe(false);
      expect(discordRoles.hasResourceAccess(emptyRoles)).toBe(false);
    });

    test('hasResourceAdminAccess', () => {
      expect(discordRoles.hasResourceAdminAccess(admin)).toBe(true);
      expect(discordRoles.hasResourceAdminAccess(manager)).toBe(false);
      expect(discordRoles.hasResourceAdminAccess(contributor)).toBe(false);
      expect(discordRoles.hasResourceAdminAccess(viewer)).toBe(false);
      expect(discordRoles.hasResourceAdminAccess(noPerms)).toBe(false);
      expect(discordRoles.hasResourceAdminAccess(emptyRoles)).toBe(false);
    });

    test('hasTargetEditAccess', () => {
      expect(discordRoles.hasTargetEditAccess(admin)).toBe(true);
      expect(discordRoles.hasTargetEditAccess(manager)).toBe(true);
      expect(discordRoles.hasTargetEditAccess(contributor)).toBe(false);
      expect(discordRoles.hasTargetEditAccess(viewer)).toBe(false);
      expect(discordRoles.hasTargetEditAccess(noPerms)).toBe(false);
      expect(discordRoles.hasTargetEditAccess(emptyRoles)).toBe(false);
    });

    test('hasReportAccess', () => {
        expect(discordRoles.hasReportAccess(admin)).toBe(true);
        expect(discordRoles.hasReportAccess(manager)).toBe(false);
        expect(discordRoles.hasReportAccess(contributor)).toBe(false);
        expect(discordRoles.hasReportAccess(viewer)).toBe(true);
        expect(discordRoles.hasReportAccess(noPerms)).toBe(false);
        expect(discordRoles.hasReportAccess(emptyRoles)).toBe(false);
    });

    test('hasUserManagementAccess', () => {
        expect(discordRoles.hasUserManagementAccess(admin)).toBe(true);
        expect(discordRoles.hasUserManagementAccess(manager)).toBe(false);
        expect(discordRoles.hasUserManagementAccess(contributor)).toBe(false);
        expect(discordRoles.hasUserManagementAccess(viewer)).toBe(false);
        expect(discordRoles.hasUserManagementAccess(noPerms)).toBe(false);
        expect(discordRoles.hasUserManagementAccess(emptyRoles)).toBe(false);
    });

    test('hasDataExportAccess', () => {
        expect(discordRoles.hasDataExportAccess(admin)).toBe(true);
        expect(discordRoles.hasDataExportAccess(manager)).toBe(false);
        expect(discordRoles.hasDataExportAccess(contributor)).toBe(false);
        expect(discordRoles.hasDataExportAccess(viewer)).toBe(false);
        expect(discordRoles.hasDataExportAccess(noPerms)).toBe(false);
        expect(discordRoles.hasDataExportAccess(emptyRoles)).toBe(false);
    });
  });
});