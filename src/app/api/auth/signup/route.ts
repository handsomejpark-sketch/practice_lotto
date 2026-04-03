import { NextResponse } from "next/server";
import { createAppSession, createUser, findUserByNickname, getDashboardPayload, hashPin } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { nickname?: string; pin?: string };
    const nickname = body.nickname?.trim();
    const pin = body.pin?.trim();

    if (!nickname || nickname.length < 2) {
      return NextResponse.json({ error: "닉네임은 2자 이상이어야 합니다." }, { status: 400 });
    }

    if (!pin || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: "PIN은 숫자 4자리만 허용됩니다." }, { status: 400 });
    }

    const existingUser = await findUserByNickname(nickname);

    if (existingUser) {
      return NextResponse.json({ error: "이미 사용 중인 닉네임입니다." }, { status: 409 });
    }

    const user = await createUser(nickname, hashPin(pin));
    await createAppSession(user.id);
    const payload = await getDashboardPayload(user.id);

    return NextResponse.json({
      message: "회원가입이 완료되었습니다.",
      user: { id: user.id, nickname: user.nickname },
      tickets: payload.tickets,
      history: payload.history,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "회원가입 처리 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
