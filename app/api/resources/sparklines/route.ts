import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasResourceAccess } from "@/lib/discord-roles";

/**
 * GET /api/resources/sparklines?days=30
 *
 * Authenticated proxy to the internal sparklines endpoint.
 * Returns `{ [resourceId]: number[] }` — oldest-first daily quantity totals.
 * Resources with fewer than 2 data points in the window fall back to all-time.
 *
 * Requires resource access.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !hasResourceAccess(session.user.roles)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const internalUrl = new URL(
    `/api/internal/resources/sparklines?${searchParams.toString()}`,
    request.nextUrl.origin,
  );

  try {
    const response = await fetch(internalUrl, {
      next: { revalidate: 60 },
      headers: {
        cookie: request.headers.get("cookie") || "",
        authorization: request.headers.get("authorization") || "",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `Internal sparklines call failed with status ${response.status}:`,
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
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching from internal sparklines route:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch sparklines" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
