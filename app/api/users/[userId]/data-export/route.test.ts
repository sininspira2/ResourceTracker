/**
 * @jest-environment node
 */
import { GET } from "./route";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

jest.mock("next-auth");
const mockGetServerSession = getServerSession as jest.Mock;

jest.mock("next/server", () => ({
  NextResponse: class MockNextResponse {
    constructor(body, init) {
      this.body = body;
      this.status = init?.status || 200;
      this.headers = new Headers(init?.headers);
    }
    static json(body, init) {
      return new this(JSON.stringify(body), { ...init, headers: { 'Content-Type': 'application/json' } });
    }
    json() {
      return Promise.resolve(JSON.parse(this.body));
    }
    text() {
      return Promise.resolve(this.body);
    }
  },
}));

jest.mock("@/lib/db", () => {
  const limitMock = jest.fn();
  const orderByMock = jest.fn();
  const whereMock = jest.fn(() => ({ limit: limitMock, orderBy: orderByMock }));
  const innerJoinMock = jest.fn(() => ({ where: whereMock }));
  const fromMock = jest.fn(() => ({ where: whereMock, innerJoin: innerJoinMock }));
  const selectMock = jest.fn(() => ({ from: fromMock }));

  // Expose the mocks for use in tests
  global.dbMocks = { selectMock, fromMock, whereMock, limitMock, orderByMock };

  return {
    db: { select: selectMock },
    users: { id: "users.id" },
    resources: { name: "resources.name" },
    resourceHistory: { id: "resourceHistory.id" },
    eq: jest.fn((a, b) => `${a} = ${b}`),
    or: jest.fn((...conditions) => conditions.join(" OR ")),
    desc: jest.fn((col) => `${col} DESC`),
  };
});


describe("GET /api/users/[userId]/data-export", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue({
      user: { permissions: { hasUserManagementAccess: true } },
    });
  });

  const createRequest = () => ({} as NextRequest);

  it("should return 401 if user lacks permissions", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { permissions: { hasUserManagementAccess: false } },
    });
    const response = await GET(createRequest(), {
      params: Promise.resolve({ userId: "any-id" }),
    });
    expect(response.status).toBe(401);
  });

  it("should return a data export successfully", async () => {
    const targetUser = { id: "target-id", username: "Target" };
    const userActivity = [{ resourceName: "Food", changeAmountHagga: 10 }];
    global.dbMocks.limitMock.mockResolvedValue([targetUser]);
    global.dbMocks.orderByMock.mockResolvedValue(userActivity);

    const response = await GET(createRequest(), {
      params: Promise.resolve({ userId: "target-id" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.user.id).toBe("target-id");
  });
});