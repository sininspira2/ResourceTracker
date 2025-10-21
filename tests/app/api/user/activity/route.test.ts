import { NextRequest, NextResponse } from "next/server";
import { GET } from "@/app/api/user/activity/route";
import { getServerSession } from "next-auth";
import { hasResourceAccess } from "@/lib/discord-roles";
import { authOptions } from "@/lib/auth";

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/discord-roles", () => ({
  hasResourceAccess: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  ...jest.requireActual("@/lib/auth"),
  authOptions: jest.fn(),
}));

const mockedGetServerSession = getServerSession as jest.Mock;
const mockedHasResourceAccess = hasResourceAccess as jest.Mock;

describe("GET /api/user/activity", () => {
  let request: NextRequest;
  const baseUrl = "http://localhost";
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    const url = new URL("/api/user/activity", baseUrl);
    request = new NextRequest(url.toString(), {
      headers: {
        cookie: "some-cookie",
        authorization: "some-auth-token",
      },
    });

    global.fetch = jest.fn();
    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should return 401 Unauthorized if there is no session", async () => {
    mockedGetServerSession.mockResolvedValue(null);

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("should return 401 Unauthorized if the user does not have resource access", async () => {
    const mockSession = {
      user: {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        roles: ["guest"],
      },
    };
    mockedGetServerSession.mockResolvedValue(mockSession);
    mockedHasResourceAccess.mockReturnValue(false);

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockedHasResourceAccess).toHaveBeenCalledWith(
      mockSession.user.roles,
    );
  });

  it("should forward the request to the internal API and return data on success", async () => {
    const mockSession = {
      user: {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        roles: ["contributor"],
      },
    };
    mockedGetServerSession.mockResolvedValue(mockSession);
    mockedHasResourceAccess.mockReturnValue(true);

    const mockActivityData = {
      activity: [{ id: 1, action: "updated_resource" }],
    };
    const mockInternalResponse = new Response(
      JSON.stringify(mockActivityData),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );

    (global.fetch as jest.Mock).mockResolvedValue(mockInternalResponse);

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(mockActivityData);

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const internalUrl = fetchCall[0] as URL;

    expect(internalUrl.origin).toBe(baseUrl);
    expect(internalUrl.pathname).toBe("/api/internal/user/activity");
    expect(internalUrl.searchParams.get("userId")).toBe("Test User");
    expect(internalUrl.searchParams.get("oldUserIds")).toBe(
      "user-123,test@example.com,Test User,unknown",
    );

    const fetchOptions = fetchCall[1];
    expect(fetchOptions.headers.cookie).toBe("some-cookie");
    expect(fetchOptions.headers.authorization).toBe("some-auth-token");
  });

  it("should return the internal API error response if the internal call fails", async () => {
    const mockSession = {
      user: {
        id: "user-123",
        roles: ["contributor"],
      },
    };
    mockedGetServerSession.mockResolvedValue(mockSession);
    mockedHasResourceAccess.mockReturnValue(true);

    const errorBody = JSON.stringify({ error: "Internal Server Error" });
    const mockInternalResponse = new Response(errorBody, {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
    (global.fetch as jest.Mock).mockResolvedValue(mockInternalResponse);

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal Server Error");
  });

  it("should return a 500 error if fetching from the internal API throws an exception", async () => {
    const mockSession = {
      user: {
        id: "user-123",
        roles: ["contributor"],
      },
    };
    mockedGetServerSession.mockResolvedValue(mockSession);
    mockedHasResourceAccess.mockReturnValue(true);

    (global.fetch as jest.Mock).mockRejectedValue(
      new Error("Network connection failed"),
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Failed to fetch activity");
  });
});
