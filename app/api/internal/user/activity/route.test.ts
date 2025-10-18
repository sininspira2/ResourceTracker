/**
 * @jest-environment node
 */
import { GET } from "./route";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";

// Mock next/server
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

// Mock the database
jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([]),
  },
  resourceHistory: {},
  resources: {},
}));

describe("GET /api/internal/user/activity", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return global user activity successfully", async () => {
    const mockActivity = [
      { id: 1, resourceName: "Wood", changeAmountHagga: 10, changeAmountDeepDesert: 5 },
    ];
    (db.limit as jest.Mock).mockResolvedValue(mockActivity);

    const req = new NextRequest("http://localhost/api/internal/user/activity?global=true");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual([{ id: 1, resourceName: "Wood", changeAmountHagga: 10, changeAmountDeepDesert: 5, changeAmount: 15 }]);
    expect(db.where).toHaveBeenCalled();
  });

  it("should return user-specific activity successfully", async () => {
    const mockActivity = [
      { id: 2, resourceName: "Stone", changeAmountHagga: -5, changeAmountDeepDesert: 0 },
    ];
    (db.limit as jest.Mock).mockResolvedValue(mockActivity);

    const req = new NextRequest("http://localhost/api/internal/user/activity?userId=user2");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual([{ id: 2, resourceName: "Stone", changeAmountHagga: -5, changeAmountDeepDesert: 0, changeAmount: -5 }]);
    expect(db.where).toHaveBeenCalled();
  });

  it("should return 400 if userId is missing for non-global request", async () => {
    const req = new NextRequest("http://localhost/api/internal/user/activity");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("userId is required for non-global activity");
  });

  it("should handle database errors gracefully", async () => {
    (db.limit as jest.Mock).mockRejectedValue(new Error("DB Error"));

    const req = new NextRequest("http://localhost/api/internal/user/activity?global=true");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Failed to fetch activity");
  });
});