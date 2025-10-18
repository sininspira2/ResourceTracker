/**
 * @jest-environment node
 */
import { GET } from "./route";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

jest.mock("next-auth");
const mockGetServerSession = getServerSession as jest.Mock;

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(body),
    })),
  },
}));

const fromMock = jest.fn();
jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn(() => ({
      from: fromMock,
    })),
  },
  users: {},
}));

describe("GET /api/users", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = () => ({} as NextRequest);

  it("should return 403 if user is not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const response = await GET(createRequest());
    expect(response.status).toBe(403);
  });

  it("should return 403 if user lacks permissions", async () => {
    mockGetServerSession.mockResolvedValue({
      user: {
        permissions: {
          hasUserManagementAccess: false,
          hasResourceAdminAccess: false,
        },
      },
    });
    const response = await GET(createRequest());
    expect(response.status).toBe(403);
  });

  it("should return users successfully with appropriate permissions", async () => {
    const mockUsers = [{ id: "1", username: "user1" }];
    fromMock.mockResolvedValue(mockUsers);
    mockGetServerSession.mockResolvedValue({
      user: { permissions: { hasUserManagementAccess: true } },
    });

    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(mockUsers);
  });

  it("should return 500 on database error", async () => {
    fromMock.mockRejectedValue(new Error("DB Error"));
    mockGetServerSession.mockResolvedValue({
      user: { permissions: { hasUserManagementAccess: true } },
    });

    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Failed to fetch users");
  });
});