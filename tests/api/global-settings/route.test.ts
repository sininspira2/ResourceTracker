/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

jest.mock("next-auth");

describe("GET /api/global-settings", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { getServerSession } = require("next-auth");
    getServerSession.mockResolvedValueOnce(null);

    jest.doMock("@/lib/global-settings", () => ({
      getLocationNames: jest.fn(),
    }));

    const { GET } = await import("@/app/api/global-settings/route");
    const request = new NextRequest("http://localhost/api/global-settings");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns configured location names", async () => {
    const { getServerSession } = require("next-auth");
    getServerSession.mockResolvedValueOnce({ user: { id: "u" } });

    const mockGetLocationNames = jest.fn().mockResolvedValue({
      location1Name: "Arrakeen",
      location2Name: "Sietch Tabr",
    });
    jest.doMock("@/lib/global-settings", () => ({
      getLocationNames: mockGetLocationNames,
    }));

    const { GET } = await import("@/app/api/global-settings/route");
    const request = new NextRequest("http://localhost/api/global-settings");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      location1Name: "Arrakeen",
      location2Name: "Sietch Tabr",
    });
    expect(mockGetLocationNames).toHaveBeenCalled();
  });

  it("returns 500 on failure", async () => {
    const { getServerSession } = require("next-auth");
    getServerSession.mockResolvedValueOnce({ user: { id: "u" } });

    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    jest.doMock("@/lib/global-settings", () => ({
      getLocationNames: jest.fn().mockRejectedValue(new Error("boom")),
    }));

    const { GET } = await import("@/app/api/global-settings/route");
    const request = new NextRequest("http://localhost/api/global-settings");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Failed to fetch global settings" });

    consoleErrorSpy.mockRestore();
  });
});
