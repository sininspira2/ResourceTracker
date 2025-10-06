import {
  getRoleHierarchy,
  getHighestRole,
  hasResourceAccess,
  hasResourceAdminAccess,
  hasTargetEditAccess,
  hasReportAccess,
  hasUserManagementAccess,
  hasDataExportAccess,
} from './discord-roles';

const mockRoles = [
  { id: 'admin-role', name: 'Admin', level: 100, isAdmin: true, canEditTargets: true, canAccessResources: true, canManageUsers: true, canExportData: true, canViewReports: true },
  { id: 'manager-role', name: 'Logistics Manager', level: 50, canEditTargets: true, canAccessResources: true },
  { id: 'contributor-role', name: 'Contributor', level: 10, canAccessResources: true },
  { id: 'viewer-role', name: 'Viewer', level: 1, canViewReports: true },
  { id: 'no-perms-role', name: 'No Perms', level: 0 },
];

describe('Discord Role-Based Access Control', () => {
  beforeAll(() => {
    process.env.DISCORD_ROLES_CONFIG = JSON.stringify(mockRoles);
  });

  afterAll(() => {
    delete process.env.DISCORD_ROLES_CONFIG;
  });

  describe('getRoleHierarchy', () => {
    it('should parse and return the role hierarchy from environment variables', () => {
      const hierarchy = getRoleHierarchy();
      expect(hierarchy).toEqual(mockRoles);
    });
  });

  describe('getHighestRole', () => {
    it('should return the role with the highest level', () => {
      const userRoles = ['contributor-role', 'manager-role'];
      const highestRole = getHighestRole(userRoles);
      expect(highestRole?.id).toBe('manager-role');
    });

    it('should return null if the user has no roles', () => {
      const highestRole = getHighestRole([]);
      expect(highestRole).toBeNull();
    });

    it('should return null if the user has roles not in the hierarchy', () => {
        const highestRole = getHighestRole(['unknown-role']);
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
      expect(hasResourceAccess(admin)).toBe(true);
      expect(hasResourceAccess(manager)).toBe(true);
      expect(hasResourceAccess(contributor)).toBe(true);
      expect(hasResourceAccess(viewer)).toBe(false);
      expect(hasResourceAccess(noPerms)).toBe(false);
      expect(hasResourceAccess(emptyRoles)).toBe(false);
    });

    test('hasResourceAdminAccess', () => {
      expect(hasResourceAdminAccess(admin)).toBe(true);
      expect(hasResourceAdminAccess(manager)).toBe(false);
      expect(hasResourceAdminAccess(contributor)).toBe(false);
      expect(hasResourceAdminAccess(viewer)).toBe(false);
      expect(hasResourceAdminAccess(noPerms)).toBe(false);
      expect(hasResourceAdminAccess(emptyRoles)).toBe(false);
    });

    test('hasTargetEditAccess', () => {
      expect(hasTargetEditAccess(admin)).toBe(true);
      expect(hasTargetEditAccess(manager)).toBe(true);
      expect(hasTargetEditAccess(contributor)).toBe(false);
      expect(hasTargetEditAccess(viewer)).toBe(false);
      expect(hasTargetEditAccess(noPerms)).toBe(false);
      expect(hasTargetEditAccess(emptyRoles)).toBe(false);
    });

    test('hasReportAccess', () => {
        expect(hasReportAccess(admin)).toBe(true);
        expect(hasReportAccess(manager)).toBe(false);
        expect(hasReportAccess(contributor)).toBe(false);
        expect(hasReportAccess(viewer)).toBe(true);
        expect(hasReportAccess(noPerms)).toBe(false);
        expect(hasReportAccess(emptyRoles)).toBe(false);
    });

    test('hasUserManagementAccess', () => {
        expect(hasUserManagementAccess(admin)).toBe(true);
        expect(hasUserManagementAccess(manager)).toBe(false);
        expect(hasUserManagementAccess(contributor)).toBe(false);
        expect(hasUserManagementAccess(viewer)).toBe(false);
        expect(hasUserManagementAccess(noPerms)).toBe(false);
        expect(hasUserManagementAccess(emptyRoles)).toBe(false);
    });

    test('hasDataExportAccess', () => {
        expect(hasDataExportAccess(admin)).toBe(true);
        expect(hasDataExportAccess(manager)).toBe(false);
        expect(hasDataExportAccess(contributor)).toBe(false);
        expect(hasDataExportAccess(viewer)).toBe(false);
        expect(hasDataExportAccess(noPerms)).toBe(false);
        expect(hasDataExportAccess(emptyRoles)).toBe(false);
    });
  });
});