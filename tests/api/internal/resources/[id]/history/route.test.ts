/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { GET } from "@/app/api/internal/resources/[id]/history/route";
import { db } from "@/tests/__mocks__/db";

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/discord-roles", () => ({
  hasResourceAccess: jest.fn().mockReturnValue(true),
}));
jest.mock("@/lib/db", () => require("@/tests/__mocks__/db"));

describe("GET /api/internal/resources/[id]/history", () => {
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
    // GET augments each history row with location-agnostic quantity fields
    // (falling back to the legacy Hagga/Deep Desert columns, which are absent
    // here -> null) and a null transferDirection.
    expect(body).toEqual([
      expect.objectContaining({
        id: "1",
        resourceId: "123",
        previousQuantityLocation1: null,
        newQuantityLocation1: null,
        changeAmountLocation1: null,
        previousQuantityLocation2: null,
        newQuantityLocation2: null,
        changeAmountLocation2: null,
        transferDirection: null,
      }),
    ]);
    expect(db.select).toHaveBeenCalled();
  });

  it("should fall back to legacy Hagga/Deep Desert quantity columns", async () => {
    const mockHistory = [
      {
        id: "2",
        resourceId: "123",
        previousQuantityHagga: 10,
        newQuantityHagga: 20,
        changeAmountHagga: 10,
        previousQuantityDeepDesert: 5,
        newQuantityDeepDesert: 5,
        changeAmountDeepDesert: 0,
        transferDirection: "to_hagga",
      },
    ];
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
    const body = await response.json();

    expect(body[0]).toEqual(
      expect.objectContaining({
        previousQuantityLocation1: 10,
        newQuantityLocation1: 20,
        changeAmountLocation1: 10,
        previousQuantityLocation2: 5,
        newQuantityLocation2: 5,
        changeAmountLocation2: 0,
        transferDirection: "transfer_to_location_1",
      }),
    );
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
