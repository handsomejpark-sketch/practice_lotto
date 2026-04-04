import { NextResponse } from "next/server";
import { logoutCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  try {
    await logoutCurrentUser();
    return NextResponse.json({ message: "안전하게 로그아웃했습니다." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "로그아웃 처리 중 문제가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
