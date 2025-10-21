/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

// Mock next/server for API route testing
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(data),
    })),
  },
  NextRequest: jest.fn((url) => ({
    url,
    searchParams: new URL(url).searchParams,
  })),
}));

const mockLimit = jest.fn();
let db: any;

describe("GET /api/internal/user/activity", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.resetModules();
    // Mock the database to isolate tests from the DB layer
    jest.doMock("@/lib/db", () => ({
      db: {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: mockLimit,
      },
      resourceHistory: {},
      resources: {},
      eq: jest.fn(),
      gte: jest.fn(),
      desc: jest.fn(),
      and: jest.fn(),
      or: jest.fn(),
    }));
    // Dynamically import db to get the mocked instance
    db = await import("@/lib/db");

    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockRestore();
  });

  // Test case for fetching global activity
  it("should return global user activity successfully", async () => {
    const mockActivity = [
      {
        id: 1,
        resourceName: "Wood",
        changeAmountHagga: 10,
        changeAmountDeepDesert: 5,
      },
    ];
    mockLimit.mockResolvedValue(mockActivity);
    const { GET } = await import("@/app/api/internal/user/activity/route");

    const req = new NextRequest(
      "http://localhost/api/internal/user/activity?global=true",
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual([{ ...mockActivity[0], changeAmount: 15 }]);
    expect(db.db.where).toHaveBeenCalled();
  });

  // Test case for fetching user-specific activity
  it("should return user-specific activity successfully", async () => {
    const mockActivity = [
      {
        id: 2,
        resourceName: "Stone",
        changeAmountHagga: -5,
        changeAmountDeepDesert: 0,
      },
    ];
    mockLimit.mockResolvedValue(mockActivity);
    const { GET } = await import("@/app/api/internal/user/activity/route");

    const req = new NextRequest(
      "http://localhost/api/internal/user/activity?userId=user2",
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual([{ ...mockActivity[0], changeAmount: -5 }]);
    expect(db.db.where).toHaveBeenCalled();
  });

  // Test case for backward compatibility with old user identifiers
  it("should consider oldUserIds for user-specific activity", async () => {
    mockLimit.mockResolvedValue([]);
    const { GET } = await import("@/app/api/internal/user/activity/route");

    const req = new NextRequest(
      "http://localhost/api/internal/user/activity?userId=user3&oldUserIds=oldUser1,oldUser2",
    );
    await GET(req);

    expect(db.db.where).toHaveBeenCalled();
  });

  // Test case for missing userId on non-global requests
  it("should return 400 if userId is missing for non-global request", async () => {
    const { GET } = await import("@/app/api/internal/user/activity/route");
    const req = new NextRequest("http://localhost/api/internal/user/activity");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("userId is required for non-global activity");
  });

  // Test case for graceful failure on database errors
  it("should handle database errors gracefully", async () => {
    mockLimit.mockRejectedValue(new Error("DB Error"));
    const { GET } = await import("@/app/api/internal/user/activity/route");

    const req = new NextRequest(
      "http://localhost/api/internal/user/activity?global=true",
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Failed to fetch activity");
  });
});
