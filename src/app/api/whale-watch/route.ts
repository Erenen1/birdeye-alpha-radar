import { NextResponse } from "next/server";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

export async function GET() {
  try {
    const res = await fetch(`${ML_SERVICE_URL}/whale-watch`, {
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Whale watch proxy error:", error);
    return NextResponse.json({ success: false, error: "ML Service unreachable" }, { status: 503 });
  }
}
