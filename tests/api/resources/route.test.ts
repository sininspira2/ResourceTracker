/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

jest.mock("next-auth", () => ({
  getServerSession: jest.fn().mockResolvedValue({
    user: {
      id: "test-user",
      roles: ["Administrator", "Contributor"],
    },
  }),
}));
jest.mock("@/lib/leaderboard", () => ({
  awardPoints: jest.fn().mockResolvedValue({ finalPoints: 10 }),
}));

describe("POST /api/resources", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("should create a new resource", async () => {
    const mockDb = {
      transaction: jest.fn().mockImplementation(async (callback) => {
        const tx = {
          insert: jest.fn().mockReturnThis(),
          values: jest.fn().mockReturnThis(),
          returning: jest.fn().mockResolvedValue([
            {
              id: "new-resource-id",
              name: "Test Resource",
              category: "Test Category",
              subcategory: "Test Subcategory",
              tier: 1,
            },
          ]),
        };
        return callback(tx);
      }),
    };
    jest.doMock("@/lib/db", () => ({
      db: mockDb,
      resources: {},
      resourceHistory: {},
    }));
    jest.doMock("@/lib/discord-roles", () => ({
      hasResourceAccess: () => true,
      hasResourceAdminAccess: () => true,
    }));

    const request = new NextRequest("http://localhost/api/resources", {
      method: "POST",
      body: JSON.stringify({
        name: "Test Resource",
        category: "Test Category",
        subcategory: "Test Subcategory",
        tier: 1,
      }),
    });

    const { POST } = await import("@/app/api/resources/route");
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      id: "new-resource-id",
      name: "Test Resource",
      category: "Test Category",
      subcategory: "Test Subcategory",
      tier: 1,
    });
  });

  it("should return a 403 error for non-admin users", async () => {
    jest.doMock("@/lib/discord-roles", () => ({
      hasResourceAccess: () => true,
      hasResourceAdminAccess: () => false,
    }));

    const request = new NextRequest("http://localhost/api/resources", {
      method: "POST",
      body: JSON.stringify({
        name: "Test Resource",
        category: "Test Category",
      }),
    });

    const { POST } = await import("@/app/api/resources/route");
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Admin access required" });
  });
});

describe("PUT /api/resources", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("should update a resource's metadata", async () => {
    const mockDb = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue([
        {
          id: "resource-id",
          name: "Updated Name",
          category: "Updated Category",
          subcategory: "Updated Subcategory",
          tier: 2,
        },
      ]),
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
    };
    jest.doMock("@/lib/db", () => ({ db: mockDb, resources: {} }));
    jest.doMock("@/lib/discord-roles", () => ({
      hasResourceAccess: () => true,
      hasResourceAdminAccess: () => true,
    }));

    const request = new NextRequest("http://localhost/api/resources", {
      method: "PUT",
      body: JSON.stringify({
        resourceMetadata: {
          id: "resource-id",
          name: "Updated Name",
          category: "Updated Category",
          subcategory: "Updated Subcategory",
          tier: 2,
        },
      }),
    });

    const { PUT } = await import("@/app/api/resources/route");
    const response = await PUT(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      id: "resource-id",
      name: "Updated Name",
      category: "Updated Category",
      subcategory: "Updated Subcategory",
      tier: 2,
    });
  });

  it("should bulk update resource quantities", async () => {
    const mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue([
        {
          id: "resource-1",
          quantityHagga: 100,
          quantityDeepDesert: 0,
          name: "Resource 1",
          category: "Category 1",
          targetQuantity: 200,
          multiplier: 1.5,
        },
      ]),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockResolvedValue(undefined),
    };
    jest.doMock("@/lib/db", () => ({
      db: mockDb,
      resources: {},
      resourceHistory: {},
    }));
    jest.doMock("@/lib/discord-roles", () => ({
      hasResourceAccess: () => true,
      hasResourceAdminAccess: () => true,
    }));

    const request = new NextRequest("http://localhost/api/resources", {
      method: "PUT",
      body: JSON.stringify({
        resourceUpdates: [
          {
            id: "resource-1",
            quantity: 150,
            updateType: "absolute",
            reason: "Test update",
          },
        ],
      }),
    });

    const { PUT } = await import("@/app/api/resources/route");
    const response = await PUT(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveProperty("resources");
    expect(body).toHaveProperty("totalPointsEarned");
    expect(body).toHaveProperty("pointsBreakdown");
  });
});

describe("GET /api/resources", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("should fetch resources from the internal API", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ resources: [] }),
      text: () => Promise.resolve(JSON.stringify({ resources: [] })),
    });

    const request = new NextRequest("http://localhost/api/resources");

    const { GET } = await import("@/app/api/resources/route");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ resources: [] });
  });
});
