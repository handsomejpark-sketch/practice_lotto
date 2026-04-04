import { NextResponse } from "next/server";
import { createAppSession, findUserByNickname, getDashboardPayload, verifyPin } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { nickname?: string; pin?: string };
    const nickname = body.nickname?.trim();
    const pin = body.pin?.trim();

    if (!nickname || !pin) {
      return NextResponse.json({ error: "닉네임과 PIN을 모두 입력해 주세요." }, { status: 400 });
    }

    const user = await findUserByNickname(nickname);

    if (!user || !verifyPin(pin, user.pin_hash)) {
      return NextResponse.json({ error: "닉네임 또는 PIN이 일치하지 않습니다." }, { status: 401 });
    }

    await createAppSession(user.id);
    const payload = await getDashboardPayload(user.id);

    return NextResponse.json({
      message: "입장 완료. 오늘의 티켓을 바로 노려보세요.",
      user: { id: user.id, nickname: user.nickname },
      tickets: payload.tickets,
      history: payload.history,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "로그인 처리 중 문제가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
