import { NextResponse } from "next/server";
import { getCurrentUser, getDashboardPayload } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
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
}
