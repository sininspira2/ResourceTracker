import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, getUserIdentifier } from "@/lib/auth";
import { hasResourceAccess } from "@/lib/discord-roles";

/**
 * GET /api/user/activity
 *
 * Returns the current user's resource activity history. Proxies to the internal
 * activity endpoint, injecting the user's current identifier and legacy IDs
 * (Discord ID, email, username) so that history recorded under old identifiers
 * is still returned.
 *
 * Requires resource access. Supports `days`, `limit` query parameters.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !hasResourceAccess(session.user.roles)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = getUserIdentifier(session);
  // Include old-style identifiers (nicknames, usernames, email) so history
  // recorded before the Discord-ID migration is still returned for this user.
  const oldUserIds = [
    session.user.discordNickname,
    session.user.name,
    session.user.email,
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
