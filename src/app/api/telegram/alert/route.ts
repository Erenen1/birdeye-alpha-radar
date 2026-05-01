/**
 * app/api/telegram/alert/route.ts
 * ================================
 * Thin Next.js route handler. Delegates all Telegram logic to the service client.
 */
import { NextResponse } from "next/server";
import { sendTelegramAlert } from "@/services/telegram/client";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const result = await sendTelegramAlert(payload);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
