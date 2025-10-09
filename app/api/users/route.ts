import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db, users } from "@/lib/db";
import {
  hasUserManagementAccess,
  hasResourceAdminAccess,
} from "@/lib/discord-roles";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  const canManageUsers =
    session?.user.permissions?.hasUserManagementAccess ?? false;
  const canAdminResources =
    session?.user.permissions?.hasResourceAdminAccess ?? false;

  if (!session || (!canManageUsers && !canAdminResources)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        customNickname: users.customNickname,
        createdAt: users.createdAt,
        lastLogin: users.lastLogin,
      })
      .from(users);

    return NextResponse.json(allUsers, {
      headers: {
        "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
