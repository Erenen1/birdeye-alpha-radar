import { NextResponse } from "next/server";
import { getTrendingTokens } from "@/services/birdeye/client";

export async function GET() {
  try {
    const data = await getTrendingTokens();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("API Error (Trending):", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch trending tokens" },
      { status: 500 }
    );
  }
}
