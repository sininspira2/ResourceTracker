/**
 * @jest-environment node
 */
import { authOptions } from "@/lib/auth";
import { nanoid } from "nanoid";

// Mock dependencies
jest.mock("@/lib/db", () => ({
  db: {
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    onConflictDoUpdate: jest.fn().mockResolvedValue(null),
  },
  users: {
    discordId: "users.discordId",
  },
}));

jest.mock("@/lib/discord-roles", () => ({
  hasResourceAccess: jest.fn((roles) => roles.includes("CONTRIBUTOR")),
  hasResourceAdminAccess: jest.fn((roles) => roles.includes("ADMIN")),
  hasTargetEditAccess: jest.fn((roles) => roles.includes("ADMIN")),
  hasReportAccess: jest.fn((roles) => roles.includes("MANAGER")),
  hasUserManagementAccess: jest.fn((roles) => roles.includes("ADMIN")),
  hasDataExportAccess: jest.fn((roles) => roles.includes("MANAGER")),
}));

jest.mock("nanoid", () => ({
  nanoid: jest.fn(() => "mocked-nanoid"),
}));

const mockDb = require("@/lib/db").db;
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("lib/auth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DISCORD_GUILD_ID = "test-guild-id";
  });

  describe("authOptions.callbacks.jwt", () => {
    const jwtCallback = authOptions.callbacks!.jwt!;

    it("should handle initial sign in correctly", async () => {
      const token = {};
      const user = {
        id: "user-id",
        name: "testuser",
        global_name: "Test User",
      };
      const account = {
        access_token: "test-access-token",
        provider: "discord",
      };

      const result = await jwtCallback({ token, user, account });

      expect(result.accessToken).toBe("test-access-token");
      expect(result.global_name).toBe("Test User");
      expect(result.rolesFetched).toBe(false);
    });

    it("should fetch discord roles and upsert user on first JWT call after sign in", async () => {
      const token = {
        accessToken: "test-access-token",
        sub: "user-discord-id",
        name: "testuser",
        picture: "avatar-url",
        rolesFetched: false,
      };

      const mockDiscordMember = {
        roles: ["CONTRIBUTOR", "MANAGER"],
        nick: "TestNickname",
        user: { username: "testuser", global_name: "Test User" },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDiscordMember,
      });

      const result = await jwtCallback({ token });

      expect(mockFetch).toHaveBeenCalledWith(
        `https://discord.com/api/v10/users/@me/guilds/test-guild-id/member`,
        { headers: { Authorization: `Bearer test-access-token` } },
      );
      expect(result.userRoles).toEqual(["CONTRIBUTOR", "MANAGER"]);
      expect(result.isInGuild).toBe(true);
      expect(result.discordNickname).toBe("TestNickname");
      expect(result.rolesFetched).toBe(true);
      expect(result.permissions).toEqual({
        hasResourceAccess: true,
        hasResourceAdminAccess: false,
        hasTargetEditAccess: false,
        hasReportAccess: true,
        hasUserManagementAccess: false,
        hasDataExportAccess: true,
      });

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "mocked-nanoid",
          discordId: "user-discord-id",
          username: "testuser",
          avatar: "avatar-url",
          customNickname: "TestNickname",
        }),
      );
      expect(mockDb.onConflictDoUpdate).toHaveBeenCalled();
    });

    it("should handle failed discord API fetch", async () => {
      const token = {
        accessToken: "test-access-token",
        rolesFetched: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      const result = await jwtCallback({ token });

      expect(result.userRoles).toEqual([]);
      expect(result.isInGuild).toBe(false);
      expect(result.discordNickname).toBe(null);
      expect(result.rolesFetched).toBe(true); // Still marks as fetched to prevent retries
    });
  });

  describe("authOptions.callbacks.session", () => {
    const sessionCallback = authOptions.callbacks!.session!;

    it("should correctly transfer data from token to session", async () => {
      const session = {
        user: {
          name: "test",
          email: "test@test.com",
          image: "image.png",
        },
        expires: new Date().toISOString(),
      };

      const token = {
        userRoles: ["CONTRIBUTOR"],
        isInGuild: true,
        discordNickname: "TestNickname",
        permissions: {
          hasResourceAccess: true,
          hasResourceAdminAccess: false,
          hasTargetEditAccess: false,
          hasReportAccess: false,
          hasUserManagementAccess: false,
          hasDataExportAccess: false,
        },
      };

      const result = await sessionCallback({ session, token });

      expect(result.user.roles).toEqual(["CONTRIBUTOR"]);
      expect(result.user.isInGuild).toBe(true);
      expect(result.user.discordNickname).toBe("TestNickname");
      expect(result.user.permissions).toEqual(token.permissions);
    });

    it("should handle missing token data gracefully", async () => {
      const session = {
        user: {
          name: "test",
          email: "test@test.com",
          image: "image.png",
        },
        expires: new Date().toISOString(),
      };
      const token = {}; // Empty token

      const result = await sessionCallback({ session, token });

      expect(result.user.roles).toEqual([]);
      expect(result.user.isInGuild).toBe(false);
      expect(result.user.discordNickname).toBe(null);
      expect(result.user.permissions).toEqual({
        hasResourceAccess: false,
        hasResourceAdminAccess: false,
        hasTargetEditAccess: false,
        hasReportAccess: false,
        hasUserManagementAccess: false,
        hasDataExportAccess: false,
      });
    });
  });
});
