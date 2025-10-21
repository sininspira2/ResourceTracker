/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { GET } from "@/app/api/internal/resources/route";
import { db, mockDbExecution } from "@/tests/__mocks__/db";

// Mock the db dependency
jest.mock("@/lib/db", () => require("@/tests/__mocks__/db"));

describe("GET /api/internal/resources", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    expect(body).toEqual(mockResources);
    expect(db.select).toHaveBeenCalled();
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
