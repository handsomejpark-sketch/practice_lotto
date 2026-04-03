import { NextResponse } from "next/server";
import { logoutCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  await logoutCurrentUser();
  return NextResponse.json({ message: "로그아웃했습니다." });
}
