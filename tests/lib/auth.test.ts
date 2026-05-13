import {
  hasRole,
  hasAnyRole,
  getDisplayName,
  getUserIdentifier,
  authOptions,
} from "@/lib/auth";
import { db } from "@/lib/db";

// Mock the database
jest.mock("@/lib/db", () => ({
  db: {
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    onConflictDoUpdate: jest.fn().mockResolvedValue(null),
  },
  users: {},
}));

describe("auth helpers", () => {
  describe("hasRole", () => {
    it("should return true if user has the required role", () => {
      expect(hasRole(["admin", "user"], "admin")).toBe(true);
    });

    it("should return false if user does not have the required role", () => {
      expect(hasRole(["user"], "admin")).toBe(false);
    });
  });

  describe("hasAnyRole", () => {
    it("should return true if user has any of the required roles", () => {
      expect(hasAnyRole(["user", "guest"], ["admin", "user"])).toBe(true);
    });

    it("should return false if user has none of the required roles", () => {
      expect(hasAnyRole(["guest"], ["admin", "user"])).toBe(false);
    });
  });

  describe("getDisplayName", () => {
    it("should return discordNickname if available", () => {
      const user = { name: "testuser", discordNickname: "Test" };
      expect(getDisplayName(user)).toBe("Test");
    });

    it("should return name if discordNickname is not available", () => {
      const user = { name: "testuser", discordNickname: null };
      expect(getDisplayName(user)).toBe("testuser");
    });

    it("should return 'Unknown User' if both are unavailable", () => {
      const user = {};
      expect(getDisplayName(user)).toBe("Unknown User");
    });
  });

  describe("getUserIdentifier", () => {
    it("should return the session user id (Discord ID)", () => {
      const session = {
        user: { id: "123456789", name: "testuser", discordNickname: "Test" },
        expires: "1",
      };
      expect(getUserIdentifier(session as any)).toBe("123456789");
    });

    it("should return 'unknown' if session user id is absent", () => {
      const session = {
        user: { id: undefined, name: "testuser", discordNickname: "Test" },
        expires: "1",
      };
      expect(getUserIdentifier(session as any)).toBe("unknown");
    });

    it("should return 'unknown' if session user is absent", () => {
      const session = { user: undefined, expires: "1" };
      expect(getUserIdentifier(session as any)).toBe("unknown");
    });
  });
});

describe("authOptions.callbacks.jwt", () => {
  const jwtCallback = authOptions.callbacks?.jwt;

  if (!jwtCallback) {
    test.only("jwt callback is not defined", () => {
      fail("authOptions.callbacks.jwt is not defined");
    });
    return;
  }

  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it("should fetch and update user roles and info on new login", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ roles: ["role1"], nick: "test-nick" }),
    });

    const token = await jwtCallback({
      token: { sub: "123", name: "test" },
      account: { access_token: "token" } as any,
      user: { global_name: "global" } as any,
    });

    expect(global.fetch).toHaveBeenCalled();
    expect(token.userRoles).toEqual(["role1"]);
    expect(token.discordNickname).toBe("test-nick");
    expect(db.onConflictDoUpdate).toHaveBeenCalled();
  });

  it("should handle failed fetch for user roles", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
    });

    const token = await jwtCallback({
      token: { sub: "123", name: "test", accessToken: "token" },
      account: null,
      user: null,
    });

    expect(token.userRoles).toEqual([]);
    expect(token.isInGuild).toBe(false);
  });

  it("should handle exceptions during fetch", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

    const token = await jwtCallback({
      token: { sub: "123", name: "test", accessToken: "token" },
      account: null,
      user: null,
    });

    expect(token.userRoles).toEqual([]);
    expect(token.isInGuild).toBe(false);
  });

  it("should handle database errors gracefully", async () => {
    (db.onConflictDoUpdate as jest.Mock).mockRejectedValue(
      new Error("DB Error"),
    );
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ roles: ["role1"], nick: "test-nick" }),
    });

    const token = await jwtCallback({
      token: { sub: "123", name: "test" },
      account: { access_token: "token" } as any,
      user: { global_name: "global" } as any,
    });

    expect(token.userRoles).toEqual(["role1"]);
  });

  it("should handle member object without nick property", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ roles: ["role1"] }),
    });

    const token = await jwtCallback({
      token: { sub: "123", name: "test" },
      account: { access_token: "token" } as any,
      user: { global_name: "global" } as any,
    });

    expect(token.discordNickname).toBeNull();
  });
});
