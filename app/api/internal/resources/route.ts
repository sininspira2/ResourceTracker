import { NextRequest, NextResponse } from "next/server";
import { db, resources } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const allResources = await db.select().from(resources);

    return NextResponse.json(allResources);
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 },
    );
  }
}
