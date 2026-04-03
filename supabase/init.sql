-- Supabase schema draft for Lotto RPS
-- Current app direction uses nickname + 4-digit PIN with app-managed sessions.
-- Because this does not yet map to Supabase Auth users, RLS policies are left as TODO.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname text NOT NULL UNIQUE,
  pin_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.game_plays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_choice text NOT NULL CHECK (user_choice IN ('rock', 'paper', 'scissors')),
  computer_choice text NOT NULL CHECK (computer_choice IN ('rock', 'paper', 'scissors')),
  result text NOT NULL CHECK (result IN ('win', 'lose', 'draw')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lotto_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  game_play_id uuid REFERENCES public.game_plays(id) ON DELETE SET NULL,
  numbers integer[] NOT NULL,
  status text NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'viewed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  viewed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.sessions(token);
CREATE INDEX IF NOT EXISTS idx_game_plays_user_id ON public.game_plays(user_id);
CREATE INDEX IF NOT EXISTS idx_lotto_tickets_user_id ON public.lotto_tickets(user_id);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotto_tickets ENABLE ROW LEVEL SECURITY;

-- TODO:
-- Custom nickname/PIN auth does not expose auth.uid() automatically.
-- After the server-side session strategy is finalized, add policies that map
-- the verified application user to these tables.
