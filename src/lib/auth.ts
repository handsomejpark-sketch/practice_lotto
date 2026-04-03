import { cookies } from "next/headers";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getSupabaseAdmin } from "./supabase-admin";
import type { DashboardPayload, GameRecord, Ticket, UserSession } from "./types";

const SESSION_COOKIE = "lotto_rps_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

type UserRow = {
  id: string;
  nickname: string;
  pin_hash: string;
};

type SessionRow = {
  id: string;
  user_id: string;
  expires_at: string;
};

type TicketRow = {
  id: string;
  numbers: number[];
  status: "issued" | "viewed";
  created_at?: string | null;
  issued_at?: string | null;
  viewed_at: string | null;
};

type PlayRow = {
  id: string;
  user_choice: GameRecord["playerChoice"];
  computer_choice: GameRecord["computerChoice"];
  result: GameRecord["result"];
  created_at: string;
};

export function hashPin(pin: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPin(pin: string, storedHash: string) {
  const [salt, saved] = storedHash.split(":");

  if (!salt || !saved) {
    return false;
  }

  const derived = scryptSync(pin, salt, 64);
  const savedBuffer = Buffer.from(saved, "hex");

  if (derived.length !== savedBuffer.length) {
    return false;
  }

  return timingSafeEqual(derived, savedBuffer);
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function cookieStore() {
  return cookies();
}

async function readSessionToken() {
  const store = await cookieStore();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

async function writeSessionToken(token: string, expiresAt: Date) {
  const store = await cookieStore();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const store = await cookieStore();
  store.delete(SESSION_COOKIE);
}

async function findSessionRow(tokenHash: string) {
  const supabase = getSupabaseAdmin();

  const tokenQuery = await supabase
    .from("sessions")
    .select("id, user_id, expires_at")
    .eq("token", tokenHash)
    .maybeSingle<SessionRow>();

  if (!tokenQuery.error || tokenQuery.error.code !== "42703") {
    return tokenQuery;
  }

  return supabase
    .from("sessions")
    .select("id, user_id, expires_at")
    .eq("session_token", tokenHash)
    .maybeSingle<SessionRow>();
}

async function insertSession(userId: string, tokenHash: string, expiresAt: string) {
  const supabase = getSupabaseAdmin();

  const primaryInsert = await supabase
    .from("sessions")
    .insert({ user_id: userId, token: tokenHash, expires_at: expiresAt })
    .select("id")
    .single();

  if (!primaryInsert.error || primaryInsert.error.code !== "PGRST204") {
    return primaryInsert;
  }

  return supabase
    .from("sessions")
    .insert({ user_id: userId, session_token: tokenHash, expires_at: expiresAt })
    .select("id")
    .single();
}

async function deleteSession(tokenHash: string) {
  const supabase = getSupabaseAdmin();

  const primaryDelete = await supabase.from("sessions").delete().eq("token", tokenHash);

  if (!primaryDelete.error || primaryDelete.error.code !== "42703") {
    return primaryDelete;
  }

  return supabase.from("sessions").delete().eq("session_token", tokenHash);
}

export async function createAppSession(userId: string) {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const inserted = await insertSession(userId, tokenHash, expiresAt.toISOString());

  if (inserted.error) {
    throw new Error(inserted.error.message);
  }

  await writeSessionToken(rawToken, expiresAt);
}

export async function getCurrentUser() {
  const rawToken = await readSessionToken();

  if (!rawToken) {
    return null;
  }

  const tokenHash = hashToken(rawToken);
  const sessionResult = await findSessionRow(tokenHash);

  if (sessionResult.error || !sessionResult.data) {
    return null;
  }

  if (new Date(sessionResult.data.expires_at).getTime() <= Date.now()) {
    await clearSessionCookie();
    await deleteSession(tokenHash);
    return null;
  }

  const supabase = getSupabaseAdmin();
  const userResult = await supabase
    .from("users")
    .select("id, nickname, pin_hash")
    .eq("id", sessionResult.data.user_id)
    .single<UserRow>();

  if (userResult.error || !userResult.data) {
    return null;
  }

  return {
    id: userResult.data.id,
    nickname: userResult.data.nickname,
  } satisfies UserSession;
}

export async function logoutCurrentUser() {
  const rawToken = await readSessionToken();

  if (rawToken) {
    await deleteSession(hashToken(rawToken));
  }

  await clearSessionCookie();
}

export async function findUserByNickname(nickname: string) {
  const supabase = getSupabaseAdmin();
  const result = await supabase
    .from("users")
    .select("id, nickname, pin_hash")
    .eq("nickname", nickname)
    .maybeSingle<UserRow>();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}

export async function createUser(nickname: string, pinHash: string) {
  const supabase = getSupabaseAdmin();
  const result = await supabase
    .from("users")
    .insert({ nickname, pin_hash: pinHash })
    .select("id, nickname, pin_hash")
    .single<UserRow>();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}

export async function getDashboardPayload(userId: string): Promise<DashboardPayload> {
  const supabase = getSupabaseAdmin();
  const [ticketResult, historyResult] = await Promise.all([
    supabase.from("lotto_tickets").select("*").eq("user_id", userId).order("issued_at", { ascending: false }),
    supabase.from("game_plays").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(8),
  ]);

  if (ticketResult.error) {
    throw new Error(ticketResult.error.message);
  }

  if (historyResult.error) {
    throw new Error(historyResult.error.message);
  }

  return {
    user: null,
    tickets: (ticketResult.data ?? []).map(mapTicket),
    history: (historyResult.data ?? []).map(mapGameRecord),
  };
}

function mapTicket(row: TicketRow): Ticket {
  return {
    id: row.id,
    numbers: row.numbers,
    status: row.status,
    createdAt: row.created_at ?? row.issued_at ?? new Date().toISOString(),
    viewedAt: row.viewed_at,
  };
}

function mapGameRecord(row: PlayRow): GameRecord {
  return {
    id: row.id,
    playerChoice: row.user_choice,
    computerChoice: row.computer_choice,
    result: row.result,
    playedAt: row.created_at,
    ticketId: null,
  };
}
