import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { decideResult, generateLottoNumbers, randomChoice } from "@/lib/game";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = (await request.json()) as { userChoice?: "rock" | "paper" | "scissors" };
    const userChoice = body.userChoice;

    if (!userChoice || !["rock", "paper", "scissors"].includes(userChoice)) {
      return NextResponse.json({ error: "올바른 선택값이 필요합니다." }, { status: 400 });
    }

    const computerChoice = randomChoice();
    const result = decideResult(userChoice, computerChoice);
    const supabase = getSupabaseAdmin();

    const gameResult = await supabase
      .from("game_plays")
      .insert({
        user_id: user.id,
        user_choice: userChoice,
        computer_choice: computerChoice,
        result,
      })
      .select("id, created_at")
      .single<{ id: string; created_at: string }>();

    if (gameResult.error) {
      return NextResponse.json({ error: gameResult.error.message }, { status: 500 });
    }

    let awardedTicket = null as null | {
      id: string;
      numbers: number[];
      status: "issued";
      createdAt: string;
      viewedAt: null;
    };

    if (result === "win") {
      const numbers = generateLottoNumbers();
      const ticketResult = await supabase
        .from("lotto_tickets")
        .insert({
          user_id: user.id,
          game_play_id: gameResult.data.id,
          numbers,
          status: "issued",
        })
        .select("*")
        .single<{
          id: string;
          numbers: number[];
          status: "issued";
          created_at?: string;
          issued_at?: string;
          viewed_at: null;
        }>();

      if (ticketResult.error) {
        return NextResponse.json({ error: ticketResult.error.message }, { status: 500 });
      }

      awardedTicket = {
        id: ticketResult.data.id,
        numbers: ticketResult.data.numbers,
        status: "issued",
        createdAt:
          ticketResult.data.created_at ?? ticketResult.data.issued_at ?? gameResult.data.created_at,
        viewedAt: null,
      };
    }

    return NextResponse.json({
      outcome: {
        playerChoice: userChoice,
        computerChoice,
        result,
        awardedTicket,
      },
      historyEntry: {
        id: gameResult.data.id,
        playerChoice: userChoice,
        computerChoice,
        result,
        playedAt: gameResult.data.created_at,
        ticketId: awardedTicket?.id ?? null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "게임 처리 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
