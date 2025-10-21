/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { GET } from "@/app/api/internal/resources/[id]/history/route";
import { db } from "@/tests/__mocks__/db";

jest.mock("@/lib/db", () => require("@/tests/__mocks__/db"));

describe("GET /api/internal/resources/[id]/history", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should return resource history for the specified number of days", async () => {
    const mockHistory = [{ id: "1", resourceId: "123", changedAt: new Date() }];
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(mockHistory),
    });

    const request = new NextRequest(
      "http://localhost/api/internal/resources/123/history?days=7",
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: "123" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(mockHistory);
    expect(db.select).toHaveBeenCalled();
  });

  it("should default to 7 days if days parameter is not provided", async () => {
    const mockHistory = [{ id: "1", resourceId: "123", changedAt: new Date() }];
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(mockHistory),
    });

    const request = new NextRequest(
      "http://localhost/api/internal/resources/123/history",
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: "123" }),
    });

    expect(response.status).toBe(200);
  });

  it("should return a 500 error on database failure", async () => {
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockRejectedValue(new Error("Database error")),
    });

    const request = new NextRequest(
      "http://localhost/api/internal/resources/123/history?days=7",
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: "123" }),
    });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Failed to fetch history" });
  });
});
