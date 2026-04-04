import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const keys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SESSION_SECRET",
  "DATABASE_URL",
] as const;

async function readPresence(key: (typeof keys)[number]) {
  let bindingPresent = false;

  try {
    const ctx = await getCloudflareContext({ async: true });
    const value = (ctx.env as Record<string, unknown>)[key];
    bindingPresent = typeof value === "string" && value.length > 0;
  } catch {
    bindingPresent = false;
  }

  const processPresent = typeof process.env[key] === "string" && process.env[key]!.length > 0;

  return {
    present: bindingPresent || processPresent,
    source: bindingPresent ? "cloudflare-binding" : processPresent ? "process.env" : "missing",
  };
}

export async function GET() {
  const entries = await Promise.all(
    keys.map(async (key) => [key, await readPresence(key)] as const),
  );

  return NextResponse.json({
    environment: process.env.NODE_ENV ?? "unknown",
    variables: Object.fromEntries(entries),
  });
}
