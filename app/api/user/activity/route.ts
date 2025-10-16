import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, getUserIdentifier } from "@/lib/auth";
import { hasResourceAccess } from "@/lib/discord-roles";

// GET /api/user/activity - Get user's activity history
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !hasResourceAccess(session.user.roles)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = getUserIdentifier(session);
  const oldUserIds = [
    session.user.id,
    session.user.email,
    session.user.name,
    "unknown",
  ]
    .filter(Boolean)
    .join(",");

  searchParams.set("userId", userId);
  searchParams.set("oldUserIds", oldUserIds);

  const internalUrl = new URL(
    `/api/internal/user/activity?${searchParams.toString()}`,
    request.nextUrl.origin,
  );

  try {
    const response = await fetch(internalUrl, {
      next: { revalidate: 15 },
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
    console.error("Error fetching from internal user activity route:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch activity" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
