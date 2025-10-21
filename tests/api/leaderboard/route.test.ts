/**
 * @jest-environment node
 */
import { GET } from "@/app/api/leaderboard/route";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

jest.mock("next-auth");
jest.mock("next/server", () => {
  const originalModule = jest.requireActual("next/server");
  return {
    ...originalModule,
    NextResponse: class MockNextResponse extends originalModule.NextResponse {
      constructor(body, init) {
        super(body, init);
        this.customBody = body;
        this.customInit = init;
      }
      static json(body, init) {
        const bodyStr = JSON.stringify(body);
        const headers = new Headers(init?.headers);
        if (!headers.has("content-type")) {
          headers.set("content-type", "application/json");
        }
        return new MockNextResponse(bodyStr, { ...init, headers });
      }
      async json() {
        return JSON.parse(this.customBody);
      }
      async text() {
        return this.customBody.toString();
      }
    },
  };
});

const mockGetServerSession = getServerSession as jest.Mock;

// Mock the global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("GET /api/leaderboard", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();

    mockGetServerSession.mockResolvedValue({
      user: { id: "test-user" },
    });

    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  const createRequest = (searchParams: string = "", headers = {}) => {
    const url = `http://localhost/api/leaderboard?${searchParams}`;
    return {
      url,
      headers: new Headers(headers),
      nextUrl: { origin: "http://localhost" },
    } as unknown as NextRequest;
  };

  it("should return 401 if user is not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const request = createRequest();
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("should call the internal leaderboard route with correct params", async () => {
    const mockResponseData = { leaderboard: [], total: 0 };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponseData),
      text: () => Promise.resolve(JSON.stringify(mockResponseData)),
      status: 200,
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    const request = createRequest("timeFilter=7d&page=2");
    await GET(request);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const fetchUrl = new URL(mockFetch.mock.calls[0][0]);
    expect(fetchUrl.pathname).toBe("/api/internal/leaderboard");
    expect(fetchUrl.searchParams.get("timeFilter")).toBe("7d");
    expect(fetchUrl.searchParams.get("page")).toBe("2");
  });

  it("should forward headers to the internal API call", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    const request = createRequest("", {
      cookie: "test-cookie",
      authorization: "Bearer test-token",
    });
    await GET(request);
    const fetchOptions = mockFetch.mock.calls[0][1];
    const headers = new Headers(fetchOptions.headers);
    expect(headers.get("cookie")).toBe("test-cookie");
    expect(headers.get("authorization")).toBe("Bearer test-token");
  });

  it("should return data from internal API on success", async () => {
    const leaderboardData = { leaderboard: [{ userId: "1", points: 100 }] };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(leaderboardData),
      text: () => Promise.resolve(JSON.stringify(leaderboardData)),
      status: 200,
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    const request = createRequest();
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(leaderboardData);
  });

  it("should return an error if the internal API call fails", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal Server Error"),
      headers: new Headers(),
    });

    const request = createRequest();
    const response = await GET(request);

    expect(response.status).toBe(500);
    const body = await response.text();
    expect(body).toBe("Internal Server Error");
  });

  it("should handle fetch throwing an error", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    const request = createRequest();
    const response = await GET(request);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Failed to fetch leaderboard");
  });
});
