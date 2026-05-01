import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { getTokenOverview } from "@/services/birdeye/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    
    if (!address) {
      return NextResponse.json({ success: false, error: "Address is required" }, { status: 400 });
    }

    const data = await getTokenOverview(address);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("API Error (Overview):", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch token overview" },
      { status: 500 }
    );
  }
}
