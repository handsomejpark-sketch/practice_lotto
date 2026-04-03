import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ ticketId: string }> },
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { ticketId } = await context.params;
    const viewedAt = new Date().toISOString();
    const supabase = getSupabaseAdmin();

    const updateResult = await supabase
      .from("lotto_tickets")
      .update({
        status: "viewed",
        viewed_at: viewedAt,
      })
      .eq("id", ticketId)
      .eq("user_id", user.id)
      .select("*")
      .single<{
        id: string;
        numbers: number[];
        status: "viewed";
        created_at?: string;
        issued_at?: string;
        viewed_at: string;
      }>();

    if (updateResult.error) {
      return NextResponse.json({ error: updateResult.error.message }, { status: 500 });
    }

    return NextResponse.json({
      ticket: {
        id: updateResult.data.id,
        numbers: updateResult.data.numbers,
        status: updateResult.data.status,
        createdAt: updateResult.data.created_at ?? updateResult.data.issued_at ?? viewedAt,
        viewedAt: updateResult.data.viewed_at,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "티켓 처리 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
