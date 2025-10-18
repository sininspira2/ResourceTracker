import { getDisplayName, getUserIdentifier } from "./auth";
import { Session } from "next-auth";

describe("auth helpers", () => {
  describe("getDisplayName", () => {
    it("should return discordNickname if available", () => {
      const user = { name: "testuser", discordNickname: "Test User" };
      expect(getDisplayName(user)).toBe("Test User");
    });

    it("should return name if discordNickname is not available", () => {
      const user = { name: "testuser", discordNickname: null };
      expect(getDisplayName(user)).toBe("testuser");
    });

    it("should return 'Unknown User' if both name and discordNickname are not available", () => {
      const user = { name: null, discordNickname: null };
      expect(getDisplayName(user)).toBe("Unknown User");
    });
  });

  describe("getUserIdentifier", () => {
    it("should return discordNickname if available", () => {
      const session = {
        user: { discordNickname: "TestUser", name: "testuser" },
      } as Session;
      expect(getUserIdentifier(session)).toBe("TestUser");
    });

    it("should return name if discordNickname is not available", () => {
      const session = {
        user: { name: "testuser", email: "test@example.com" },
      } as Session;
      expect(getUserIdentifier(session)).toBe("testuser");
    });

    it("should return email if discordNickname and name are not available", () => {
      const session = {
        user: { email: "test@example.com", id: "123" },
      } as Session;
      expect(getUserIdentifier(session)).toBe("test@example.com");
    });

    it("should return id if discordNickname, name, and email are not available", () => {
      const session = { user: { id: "123" } } as Session;
      expect(getUserIdentifier(session)).toBe("123");
    });

    it("should return 'unknown' if no identifier is available", () => {
      const session = { user: {} } as Session;
      expect(getUserIdentifier(session)).toBe("unknown");
    });
  });
});