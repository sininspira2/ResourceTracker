/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { jest } from "@jest/globals";

const mockDbSelect = jest.fn();

describe("GET /api/internal/leaderboard", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // Mock db so the display-name lookup doesn't try a real connection.
    // Return an empty users list so displayName falls back to userId.
    mockDbSelect.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });
    jest.doMock("@/lib/db", () => ({
      db: { select: mockDbSelect },
      users: {
        discordId: "users.discordId",
        customNickname: "users.customNickname",
        username: "users.username",
      },
    }));
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should call getLeaderboard with default parameters", async () => {
    const mockGetLeaderboard = jest
      .fn()
      .mockResolvedValue({ rankings: [], total: 0 });
    jest.doMock("@/lib/leaderboard", () => ({
      ...jest.requireActual("@/lib/leaderboard"),
      getLeaderboard: mockGetLeaderboard,
    }));

    const { GET } = await import("@/app/api/internal/leaderboard/route");
    const request = new NextRequest(
      "http://localhost/api/internal/leaderboard",
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockGetLeaderboard).toHaveBeenCalledWith("all", 20, 0);
    expect(body).toEqual({
      leaderboard: [],
      timeFilter: "all",
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    });
  });

  it("should call getLeaderboard with provided parameters", async () => {
    const mockGetLeaderboard = jest.fn().mockResolvedValue({
      rankings: [{ userId: "discord-user-1", totalPoints: 100 }],
      total: 1,
    });
    jest.doMock("@/lib/leaderboard", () => ({
      ...jest.requireActual("@/lib/leaderboard"),
      getLeaderboard: mockGetLeaderboard,
    }));

    // Return a resolved display name for the Discord ID
    mockDbSelect.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([
          {
            discordId: "discord-user-1",
            customNickname: "Player One",
            username: "playerone",
          },
        ]),
      }),
    });

    const { GET } = await import("@/app/api/internal/leaderboard/route");
    const request = new NextRequest(
      "http://localhost/api/internal/leaderboard?timeFilter=7d&limit=10&page=2&pageSize=5",
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockGetLeaderboard).toHaveBeenCalledWith("7d", 10, 5);
    expect(body).toEqual({
      leaderboard: [
        { userId: "discord-user-1", totalPoints: 100, displayName: "Player One" },
      ],
      timeFilter: "7d",
      total: 1,
      page: 2,
      pageSize: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: true,
    });
  });

  it("falls back to userId when Discord ID has no matching user record", async () => {
    const mockGetLeaderboard = jest.fn().mockResolvedValue({
      rankings: [{ userId: "old-nickname", totalPoints: 50 }],
      total: 1,
    });
    jest.doMock("@/lib/leaderboard", () => ({
      ...jest.requireActual("@/lib/leaderboard"),
      getLeaderboard: mockGetLeaderboard,
    }));

    // No user found for this entry (old pre-migration nickname)
    mockDbSelect.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });

    const { GET } = await import("@/app/api/internal/leaderboard/route");
    const request = new NextRequest(
      "http://localhost/api/internal/leaderboard",
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.leaderboard[0]).toEqual({
      userId: "old-nickname",
      totalPoints: 50,
      displayName: "old-nickname",
    });
  });

  it("should return a 500 error if getLeaderboard throws an error", async () => {
    const mockGetLeaderboard = jest
      .fn()
      .mockRejectedValue(new Error("Database error"));
    jest.doMock("@/lib/leaderboard", () => ({
      ...jest.requireActual("@/lib/leaderboard"),
      getLeaderboard: mockGetLeaderboard,
    }));

    const { GET } = await import("@/app/api/internal/leaderboard/route");
    const request = new NextRequest(
      "http://localhost/api/internal/leaderboard",
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Failed to fetch leaderboard" });
  });
});
