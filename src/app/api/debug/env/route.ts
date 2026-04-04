import { NextResponse } from "next/server";

export const runtime = "nodejs";

const keys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SESSION_SECRET",
  "DATABASE_URL",
] as const;

export async function GET() {
  const result = Object.fromEntries(
    keys.map((key) => [
      key,
      {
        present: Boolean(process.env[key]),
        source: process.env[key] ? "process.env" : "missing",
      },
    ]),
  );

  return NextResponse.json({
    environment: process.env.NODE_ENV ?? "unknown",
    variables: result,
  });
}
