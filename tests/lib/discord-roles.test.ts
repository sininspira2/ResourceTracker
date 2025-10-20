import type * as DiscordRoles from "./discord-roles";

const mockRoles = [
  {
    id: "admin-role",
    name: "Admin",
    level: 100,
    isAdmin: true,
    canEditTargets: true,
    canAccessResources: true,
    canManageUsers: true,
    canExportData: true,
    canViewReports: true,
  },
  {
    id: "manager-role",
    name: "Logistics Manager",
    level: 50,
    canEditTargets: true,
    canAccessResources: true,
  },
  {
    id: "contributor-role",
    name: "Contributor",
    level: 10,
    canAccessResources: true,
  },
  { id: "viewer-role", name: "Viewer", level: 1, canViewReports: true },
  { id: "no-perms-role", name: "No Perms", level: 0 },
];

describe("Discord Role-Based Access Control", () => {
  let discordRoles: typeof DiscordRoles;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules(); // Clear the module cache to get a fresh instance
    process.env = {
      ...originalEnv,
      DISCORD_ROLES_CONFIG: JSON.stringify(mockRoles),
    };
    // Require the module inside the test setup to get a fresh copy
    discordRoles = require("@/lib/discord-roles");
  });

  afterEach(() => {
    process.env = originalEnv; // Restore the original environment
  });

  describe("getRoleHierarchy", () => {
    it("should parse and return the role hierarchy from environment variables", () => {
      const hierarchy = discordRoles.getRoleHierarchy();
      expect(hierarchy).toEqual(mockRoles);
    });

    describe("Error and Edge Case Handling", () => {
      const consoleWarnSpy = jest
        .spyOn(console, "warn")
        .mockImplementation(() => {});
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      beforeEach(() => {
        consoleWarnSpy.mockClear();
        consoleErrorSpy.mockClear();
      });

      it("should return an empty array and warn if DISCORD_ROLES_CONFIG is not set", () => {
        delete process.env.DISCORD_ROLES_CONFIG;
        jest.resetModules();
        const discordRoles = require("@/lib/discord-roles");
        const hierarchy = discordRoles.getRoleHierarchy();
        expect(hierarchy).toEqual([]);
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("No DISCORD_ROLES_CONFIG found"),
        );
      });

      it("should return an empty array and error if config is invalid JSON", () => {
        process.env.DISCORD_ROLES_CONFIG = "invalid-json";
        jest.resetModules();
        const discordRoles = require("@/lib/discord-roles");
        const hierarchy = discordRoles.getRoleHierarchy();
        expect(hierarchy).toEqual([]);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Failed to parse DISCORD_ROLES_CONFIG:",
          expect.any(String),
        );
      });

      it("should return an empty array and error if config is not an array", () => {
        process.env.DISCORD_ROLES_CONFIG = JSON.stringify({ not: "an array" });
        jest.resetModules();
        const discordRoles = require("@/lib/discord-roles");
        const hierarchy = discordRoles.getRoleHierarchy();
        expect(hierarchy).toEqual([]);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "DISCORD_ROLES_CONFIG must be an array, got:",
          "object",
        );
      });

      it("should filter out invalid role objects and warn", () => {
        process.env.DISCORD_ROLES_CONFIG = JSON.stringify([
          { id: "valid", name: "Valid Role" },
          null,
          { name: "missing-id" },
          { id: "missing-name" },
        ]);
        jest.resetModules();
        const discordRoles = require("@/lib/discord-roles");
        const hierarchy = discordRoles.getRoleHierarchy();
        expect(hierarchy).toHaveLength(1);
        expect(hierarchy[0].id).toBe("valid");
        expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
      });

      it("should warn if all roles after filtering are invalid", () => {
        process.env.DISCORD_ROLES_CONFIG = JSON.stringify([
          { name: "missing-id" },
        ]);
        jest.resetModules();
        const discordRoles = require("@/lib/discord-roles");
        discordRoles.getRoleHierarchy();
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("No valid roles found"),
        );
      });
    });
  });

  describe("getRoleName", () => {
    it("should return the role name for a given ID", () => {
      const roleName = discordRoles.getRoleName("manager-role");
      expect(roleName).toBe("Logistics Manager");
    });

    it("should return a default string for an unknown ID", () => {
      const roleName = discordRoles.getRoleName("unknown-id");
      expect(roleName).toBe("Unknown Role (unknown-id)");
    });
  });

  describe("getHighestRole", () => {
    it("should return the role with the highest level", () => {
      const userRoles = ["contributor-role", "manager-role"];
      const highestRole = discordRoles.getHighestRole(userRoles);
      expect(highestRole?.id).toBe("manager-role");
    });

    it("should return null if the user has no roles", () => {
      const highestRole = discordRoles.getHighestRole([]);
      expect(highestRole).toBeNull();
    });

    it("should return null if the user has roles not in the hierarchy", () => {
      const highestRole = discordRoles.getHighestRole(["unknown-role"]);
      expect(highestRole).toBeNull();
    });
  });

  describe("Permission Checks", () => {
    const adminRoles = ["admin-role"];
    const managerRoles = ["manager-role", "contributor-role"];
    const contributorRoles = ["contributor-role"];
    const viewerRoles = ["viewer-role"];
    const noPermsRoles = ["no-perms-role"];
    const emptyRoles: string[] = [];

    const testCases = [
      {
        func: "hasResourceAccess",
        expected: [true, true, true, false, false, false],
      },
      {
        func: "hasResourceAdminAccess",
        expected: [true, false, false, false, false, false],
      },
      {
        func: "hasTargetEditAccess",
        expected: [true, true, false, false, false, false],
      },
      {
        func: "hasReportAccess",
        expected: [true, false, false, true, false, false],
      },
      {
        func: "hasUserManagementAccess",
        expected: [true, false, false, false, false, false],
      },
      {
        func: "hasDataExportAccess",
        expected: [true, false, false, false, false, false],
      },
    ] as const;

    const roles = [
      adminRoles,
      managerRoles,
      contributorRoles,
      viewerRoles,
      noPermsRoles,
      emptyRoles,
    ];

    testCases.forEach(({ func, expected }) => {
      describe(func, () => {
        it.each([
          ["admin", roles[0], expected[0]],
          ["manager", roles[1], expected[1]],
          ["contributor", roles[2], expected[2]],
          ["viewer", roles[3], expected[3]],
          ["no-perms", roles[4], expected[4]],
          ["empty", roles[5], expected[5]],
        ])(
          "should return %s for %s user",
          (_roleName, userRoles, expectedResult) => {
            expect(discordRoles[func](userRoles as string[])).toBe(
              expectedResult,
            );
          },
        );
      });
    });
  });
});
