/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { GET } from "@/app/api/internal/resources/route";
import { db, mockDbExecution } from "@/tests/__mocks__/db";

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/discord-roles", () => ({
  hasResourceAccess: jest.fn().mockReturnValue(true),
}));
// Mock the db dependency
jest.mock("@/lib/db", () => require("@/tests/__mocks__/db"));

describe("GET /api/internal/resources", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { roles: ["Member"] },
    });
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should return a list of resources on success", async () => {
    const mockResources = [
      { id: "1", name: "Resource 1" },
      { id: "2", name: "Resource 2" },
    ];
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockResolvedValue(mockResources),
    });

    const request = new NextRequest("http://localhost/api/internal/resources");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    // GET augments each resource with location-agnostic quantity fields
    // (falling back to 0 when the Hagga/Deep Desert columns are absent) and
    // preserves the original category (null here -> null).
    expect(body).toEqual([
      {
        id: "1",
        name: "Resource 1",
        category: null,
        quantityLocation1: 0,
        quantityLocation2: 0,
      },
      {
        id: "2",
        name: "Resource 2",
        category: null,
        quantityLocation1: 0,
        quantityLocation2: 0,
      },
    ]);
    expect(db.select).toHaveBeenCalled();
  });

  it("should map legacy 'Blueprints' category to 'Gear Blueprints'", async () => {
    const mockResources = [
      {
        id: "3",
        name: "Old Blueprint",
        category: "Blueprints",
        quantityHagga: 5,
        quantityDeepDesert: 2,
      },
    ];
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockResolvedValue(mockResources),
    });

    const request = new NextRequest("http://localhost/api/internal/resources");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body[0]).toEqual(
      expect.objectContaining({
        category: "Gear Blueprints",
        quantityLocation1: 5,
        quantityLocation2: 2,
      }),
    );
  });

  it("should prefer new location columns when present", async () => {
    const mockResources = [
      {
        id: "4",
        name: "With Loc",
        category: "Raw",
        quantityHagga: 5,
        quantityDeepDesert: 2,
        quantityLocation1: 100,
        quantityLocation2: 50,
      },
    ];
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockResolvedValue(mockResources),
    });

    const request = new NextRequest("http://localhost/api/internal/resources");
    const response = await GET(request);
    const body = await response.json();

    expect(body[0].quantityLocation1).toBe(100);
    expect(body[0].quantityLocation2).toBe(50);
  });

  it("should return a 500 error on failure", async () => {
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockRejectedValue(new Error("Database error")),
    });

    const request = new NextRequest("http://localhost/api/internal/resources");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Failed to fetch resources" });
  });
});
