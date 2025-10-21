/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { UserSession } from "@/lib/auth";

describe("GET /api/resources/[id]/history", () => {
  beforeEach(() => {
    jest.resetModules();
    global.fetch = jest.fn();
  });

  it("should return 401 if user is not authenticated", async () => {
    jest.doMock("next-auth", () => ({
      getServerSession: jest.fn().mockResolvedValue(null),
    }));
    const { GET } = await import("@/app/api/resources/[id]/history/route");
    const request = new NextRequest(
      "http://localhost/api/resources/123/history",
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: "123" }),
    });
    expect(response.status).toBe(401);
  });

  it("should return 401 if user does not have resource access", async () => {
    const mockSession: UserSession = {
      user: {
        id: "1",
        name: "test",
        email: "test@test.com",
        image: "",
        roles: ["SomeRole"],
      },
      expires: "",
    };
    jest.doMock("next-auth", () => ({
      getServerSession: jest.fn().mockResolvedValue(mockSession),
    }));
    jest.doMock("@/lib/discord-roles", () => ({
      hasResourceAccess: jest.fn().mockReturnValue(false),
    }));
    const { GET } = await import("@/app/api/resources/[id]/history/route");
    const request = new NextRequest(
      "http://localhost/api/resources/123/history",
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: "123" }),
    });
    expect(response.status).toBe(401);
  });

  it("should fetch and return data if user is authorized", async () => {
    const mockSession: UserSession = {
      user: {
        id: "1",
        name: "test",
        email: "test@test.com",
        image: "",
        roles: ["Contributor"],
      },
      expires: "",
    };
    jest.doMock("next-auth", () => ({
      getServerSession: jest.fn().mockResolvedValue(mockSession),
    }));
    jest.doMock("@/lib/discord-roles", () => ({
      hasResourceAccess: jest.fn().mockReturnValue(true),
    }));
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: "test" }),
      text: () => Promise.resolve(JSON.stringify({ data: "test" })),
    });
    const { GET } = await import("@/app/api/resources/[id]/history/route");
    const request = new NextRequest(
      "http://localhost/api/resources/123/history",
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: "123" }),
    });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toEqual({ data: "test" });
  });

  it("should return a matching status code if the internal API call fails", async () => {
    const mockSession: UserSession = {
      user: {
        id: "1",
        name: "test",
        email: "test@test.com",
        image: "",
        roles: ["Contributor"],
      },
      expires: "",
    };
    jest.doMock("next-auth", () => ({
      getServerSession: jest.fn().mockResolvedValue(mockSession),
    }));
    jest.doMock("@/lib/discord-roles", () => ({
      hasResourceAccess: jest.fn().mockReturnValue(true),
    }));
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal Server Error"),
    });
    const { GET } = await import("@/app/api/resources/[id]/history/route");
    const request = new NextRequest(
      "http://localhost/api/resources/123/history",
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: "123" }),
    });
    expect(response.status).toBe(500);
  });
});
