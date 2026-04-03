import { NextResponse } from "next/server";
import { createAppSession, findUserByNickname, getDashboardPayload, verifyPin } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { nickname?: string; pin?: string };
    const nickname = body.nickname?.trim();
    const pin = body.pin?.trim();

    if (!nickname || !pin) {
      return NextResponse.json({ error: "닉네임과 PIN을 입력하세요." }, { status: 400 });
    }

    const user = await findUserByNickname(nickname);

    if (!user || !verifyPin(pin, user.pin_hash)) {
      return NextResponse.json({ error: "닉네임 또는 PIN이 올바르지 않습니다." }, { status: 401 });
    }

    await createAppSession(user.id);
    const payload = await getDashboardPayload(user.id);

    return NextResponse.json({
      message: "다시 돌아오셨네요. 오늘도 티켓을 노려보세요.",
      user: { id: user.id, nickname: user.nickname },
      tickets: payload.tickets,
      history: payload.history,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "로그인 처리 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
