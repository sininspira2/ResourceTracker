/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

jest.mock("next-auth");

describe("PUT /api/global-settings", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { getServerSession } = require("next-auth");
    getServerSession.mockResolvedValueOnce(null);

    const { PUT } = await import("@/app/api/global-settings/route");
    const request = new NextRequest("http://localhost/api/global-settings", {
      method: "PUT",
      body: JSON.stringify({ location1Name: "Hagga", location2Name: "Deep Desert" }),
      headers: { "Content-Type": "application/json" },
    });
    const response = await PUT(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns 403 when session lacks admin access", async () => {
    const { getServerSession } = require("next-auth");
    getServerSession.mockResolvedValueOnce({
      user: { permissions: { hasResourceAdminAccess: false } },
    });

    const { PUT } = await import("@/app/api/global-settings/route");
    const request = new NextRequest("http://localhost/api/global-settings", {
      method: "PUT",
      body: JSON.stringify({ location1Name: "Hagga", location2Name: "Deep Desert" }),
      headers: { "Content-Type": "application/json" },
    });
    const response = await PUT(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden" });
  });

  it("returns 400 when location1Name is missing", async () => {
    const { getServerSession } = require("next-auth");
    getServerSession.mockResolvedValueOnce({
      user: { permissions: { hasResourceAdminAccess: true } },
    });

    const { PUT } = await import("@/app/api/global-settings/route");
    const request = new NextRequest("http://localhost/api/global-settings", {
      method: "PUT",
      body: JSON.stringify({ location2Name: "Deep Desert" }),
      headers: { "Content-Type": "application/json" },
    });
    const response = await PUT(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Invalid location names" });
  });

  it("returns 400 when location1Name is empty", async () => {
    const { getServerSession } = require("next-auth");
    getServerSession.mockResolvedValueOnce({
      user: { permissions: { hasResourceAdminAccess: true } },
    });

    const { PUT } = await import("@/app/api/global-settings/route");
    const request = new NextRequest("http://localhost/api/global-settings", {
      method: "PUT",
      body: JSON.stringify({ location1Name: "  ", location2Name: "Deep Desert" }),
      headers: { "Content-Type": "application/json" },
    });
    const response = await PUT(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Invalid location names" });
  });

  it("returns 400 when location name exceeds 50 characters", async () => {
    const { getServerSession } = require("next-auth");
    getServerSession.mockResolvedValueOnce({
      user: { permissions: { hasResourceAdminAccess: true } },
    });

    const { PUT } = await import("@/app/api/global-settings/route");
    const longName = "A".repeat(51);
    const request = new NextRequest("http://localhost/api/global-settings", {
      method: "PUT",
      body: JSON.stringify({ location1Name: longName, location2Name: "Deep Desert" }),
      headers: { "Content-Type": "application/json" },
    });
    const response = await PUT(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Invalid location names" });
  });

  it("returns 400 for invalid JSON body", async () => {
    const { getServerSession } = require("next-auth");
    getServerSession.mockResolvedValueOnce({
      user: { permissions: { hasResourceAdminAccess: true } },
    });

    const { PUT } = await import("@/app/api/global-settings/route");
    const request = new NextRequest("http://localhost/api/global-settings", {
      method: "PUT",
      body: "not-json",
      headers: { "Content-Type": "application/json" },
    });
    const response = await PUT(request);
    const body = await response.json();

    expect(response.status).toBe(400);
  });

  it("returns 200 and calls db upsert with trimmed names on valid admin request", async () => {
    const { getServerSession } = require("next-auth");
    getServerSession.mockResolvedValueOnce({
      user: { permissions: { hasResourceAdminAccess: true } },
    });

    const mockOnConflictDoUpdate = jest.fn().mockResolvedValue(undefined);
    const mockValues = jest.fn().mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
    const mockInsert = jest.fn().mockReturnValue({ values: mockValues });

    jest.doMock("@/lib/db", () => ({
      db: { insert: mockInsert },
      globalSettings: {},
    }));
    jest.doMock("@/lib/global-settings", () => ({
      getLocationNames: jest.fn(),
      LOCATION_1_NAME_KEY: "inventory_location_1_name",
      LOCATION_2_NAME_KEY: "inventory_location_2_name",
    }));

    const { PUT } = await import("@/app/api/global-settings/route");
    const request = new NextRequest("http://localhost/api/global-settings", {
      method: "PUT",
      body: JSON.stringify({ location1Name: "  Arrakeen  ", location2Name: "Sietch Tabr" }),
      headers: { "Content-Type": "application/json" },
    });
    const response = await PUT(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ location1Name: "Arrakeen", location2Name: "Sietch Tabr" });
    expect(mockInsert).toHaveBeenCalledWith({});
  });

  it("returns 500 on database failure", async () => {
    const { getServerSession } = require("next-auth");
    getServerSession.mockResolvedValueOnce({
      user: { permissions: { hasResourceAdminAccess: true } },
    });

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const mockOnConflictDoUpdate = jest.fn().mockRejectedValue(new Error("DB failure"));
    const mockValues = jest.fn().mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
    const mockInsert = jest.fn().mockReturnValue({ values: mockValues });

    jest.doMock("@/lib/db", () => ({
      db: { insert: mockInsert },
      globalSettings: {},
    }));
    jest.doMock("@/lib/global-settings", () => ({
      getLocationNames: jest.fn(),
      LOCATION_1_NAME_KEY: "inventory_location_1_name",
      LOCATION_2_NAME_KEY: "inventory_location_2_name",
    }));

    const { PUT } = await import("@/app/api/global-settings/route");
    const request = new NextRequest("http://localhost/api/global-settings", {
      method: "PUT",
      body: JSON.stringify({ location1Name: "Hagga", location2Name: "Deep Desert" }),
      headers: { "Content-Type": "application/json" },
    });
    const response = await PUT(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Failed to update global settings" });

    consoleErrorSpy.mockRestore();
  });
});
