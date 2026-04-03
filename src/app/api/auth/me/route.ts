import { NextResponse } from "next/server";
import { getCurrentUser, getDashboardPayload } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ user: null, tickets: [], history: [] });
    }

    const payload = await getDashboardPayload(user.id);

    return NextResponse.json({
      user,
      tickets: payload.tickets,
      history: payload.history,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "세션 조회 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message, user: null, tickets: [], history: [] }, { status: 500 });
  }
}
