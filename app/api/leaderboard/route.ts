import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const internalUrl = new URL(
    `/api/internal/leaderboard?${searchParams.toString()}`,
    request.nextUrl.origin,
  );

  try {
    const response = await fetch(internalUrl, {
      next: { revalidate: 20 },
      headers: {
        cookie: request.headers.get("cookie") || "",
        authorization: request.headers.get("authorization") || "",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `Internal API call failed with status ${response.status}:`,
        errorBody,
      );
      return new NextResponse(errorBody, {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching from internal leaderboard route:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch leaderboard" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}