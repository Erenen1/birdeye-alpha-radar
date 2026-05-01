/**
 * app/api/predict/route.ts
 * ========================
 * Thin Next.js route handler. Delegates all ML logic to the service client.
 */
import { NextResponse } from "next/server";
import { predictTokens, mergeMLResults } from "@/services/ml/client";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { tokens } = await req.json();

    if (!tokens || !Array.isArray(tokens)) {
      return NextResponse.json({ success: false, error: "Invalid tokens payload" }, { status: 400 });
    }

    const predictions = await predictTokens(tokens);

    if (predictions) {
      return NextResponse.json({ success: true, data: mergeMLResults(tokens, predictions) });
    }

    // ML service unreachable — pass raw tokens through so UI never breaks
    return NextResponse.json({ success: true, data: tokens });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
