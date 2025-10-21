/**
 * @jest-environment node
 */
import { GET } from "@/app/api/leaderboard/[userId]/route";
import { getUserContributions, getUserRank } from "@/lib/leaderboard";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

jest.mock("next-auth");
jest.mock("@/lib/leaderboard");

describe("GET /api/leaderboard/[userId]", () => {
  it("should call getUserContributions and getUserRank with default parameters", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "test-user" } });
    (getUserContributions as jest.Mock).mockResolvedValue({ contributions: [], total: 0, summary: {} });
    (getUserRank as jest.Mock).mockResolvedValue(1);

    const request = new NextRequest("http://localhost/api/leaderboard/test-user");
    const response = await GET(request, { params: Promise.resolve({ userId: "test-user" }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getUserContributions).toHaveBeenCalledWith("test-user", "all", 20, 0);
    expect(getUserRank).toHaveBeenCalledWith("test-user", "all");
    expect(body).toEqual({
      userId: "test-user",
      timeFilter: "all",
      rank: 1,
      contributions: [],
      summary: {},
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    });
  });

  it("should call getUserContributions and getUserRank with provided parameters", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "test-user" } });
    (getUserContributions as jest.Mock).mockResolvedValue({
      contributions: [{ id: "1" }],
      total: 1,
      summary: { totalPoints: 100 },
    });
    (getUserRank as jest.Mock).mockResolvedValue(1);

    const request = new NextRequest(
      "http://localhost/api/leaderboard/test-user?timeFilter=7d&limit=10&page=2&pageSize=5",
    );
    const response = await GET(request, { params: Promise.resolve({ userId: "test-user" }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getUserContributions).toHaveBeenCalledWith("test-user", "7d", 10, 5);
    expect(getUserRank).toHaveBeenCalledWith("test-user", "7d");
    expect(body).toEqual({
      userId: "test-user",
      timeFilter: "7d",
      rank: 1,
      contributions: [{ id: "1" }],
      summary: { totalPoints: 100 },
      total: 1,
      page: 2,
      pageSize: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: true,
    });
  });

  it("should return a 500 error if getUserContributions throws an error", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "test-user" } });
    (getUserContributions as jest.Mock).mockRejectedValue(new Error("Database error"));
    (getUserRank as jest.Mock).mockResolvedValue(1);

    const request = new NextRequest("http://localhost/api/leaderboard/test-user");
    const response = await GET(request, { params: Promise.resolve({ userId: "test-user" }) });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Failed to fetch user contributions" });
  });
});
