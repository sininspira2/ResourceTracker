/**
 * @jest-environment node
 */
import { POST } from "@/app/api/resources/bulk/route";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

jest.mock("next-auth");
jest.mock("@/lib/discord-roles");

describe("POST /api/resources/bulk", () => {
  const mockGetServerSession = getServerSession as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue({
      user: { roles: ["Target Editor"] },
    });
    require("@/lib/discord-roles").hasTargetEditAccess.mockReturnValue(true);
  });

  it("should return 400 for invalid file type", async () => {
    const formData = new FormData();
    formData.append(
      "file",
      new File(["content"], "test.txt", { type: "text/plain" }),
    );

    const request = new NextRequest("http://localhost/api/resources/bulk", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid file type. Please upload a .csv file.");
  });

  it("should return 400 for file size exceeding the limit", async () => {
    const largeContent = "a".repeat(257 * 1024);
    const formData = new FormData();
    formData.append(
      "file",
      new File([largeContent], "large.csv", { type: "text/csv" }),
    );

    const request = new NextRequest("http://localhost/api/resources/bulk", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("File size exceeds the 256KB limit.");
  });
});
