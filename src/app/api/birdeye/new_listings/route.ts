import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { getNewListings } from "@/services/birdeye/client";

export async function GET() {
  try {
    const data = await getNewListings();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("API Error (New Listings):", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch new listings" },
      { status: 500 }
    );
  }
}
