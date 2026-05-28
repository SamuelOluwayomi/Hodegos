-- ============================================================================
-- HODEGOS -- COMPLETE DATABASE SCHEMA
-- Supabase / PostgreSQL
-- Run this entire file once in the Supabase SQL editor to set up all tables.
-- ============================================================================

-- ============================================================================
-- SECTION 1: CORE TABLES
-- ============================================================================

-- Users
-- Core user identity, linked to wallet address.
-- One row per wallet. Created automatically on first login.
CREATE TABLE IF NOT EXISTS public.users (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address      text UNIQUE NOT NULL,
  user_name           text,
  ai_tone             text DEFAULT 'friendly'
                      CHECK (ai_tone IN ('friendly', 'disciplined', 'straight', 'socratic')),
  trading_level       text DEFAULT 'unknown'
                      CHECK (trading_level IN ('unknown', 'beginner', 'intermediate', 'master')),
  xp                  integer DEFAULT 0,
  onboarding_complete boolean DEFAULT false,
  onboarding_step     text DEFAULT 'welcome',
  demo_completed      boolean DEFAULT false,
  created_at          timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  updated_at          timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_wallet ON public.users(wallet_address);


-- Trades
-- Records every trade executed on-chain via Injective Testnet.
-- Also used to record simulated (paper) trades during onboarding.
CREATE TABLE IF NOT EXISTS public.trades (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  pair        text NOT NULL,
  side        text NOT NULL CHECK (side IN ('buy', 'sell')),
  order_type  text NOT NULL CHECK (order_type IN ('market', 'limit')),
  amount      numeric NOT NULL,
  price       numeric NOT NULL,
  total_value numeric NOT NULL,
  tx_hash     text,
  executed_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trades_user     ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_executed ON public.trades(executed_at DESC);


-- User Badges
-- Tracks earned badges per user. One row per badge per user.
CREATE TABLE IF NOT EXISTS public.user_badges (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_name  text NOT NULL,
  earned_at   timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE(user_id, badge_name)
);

CREATE INDEX IF NOT EXISTS idx_badges_user ON public.user_badges(user_id);


-- Chat Messages
-- Persists conversation history for stateful AI memory across sessions.
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content    text NOT NULL,
  context    text,
  created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_user    ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_context ON public.chat_messages(user_id, context);


-- User Memory
-- Key-value store for AI-remembered facts about the user.
-- Examples: 'favorite_pair' -> 'INJ/USDT', 'risk_tolerance' -> 'low'
CREATE TABLE IF NOT EXISTS public.user_memory (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  memory_key   text NOT NULL,
  memory_value text NOT NULL,
  updated_at   timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE(user_id, memory_key)
);

CREATE INDEX IF NOT EXISTS idx_memory_user ON public.user_memory(user_id);


-- Quiz Scores
-- Tracks individual quiz attempts, scores, and XP awarded.
CREATE TABLE IF NOT EXISTS public.quiz_scores (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  quiz_type        text NOT NULL,
  total_questions  integer NOT NULL,
  correct_answers  integer NOT NULL,
  xp_earned        integer DEFAULT 0,
  completed_at     timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quiz_user ON public.quiz_scores(user_id);


-- XP Ledger
-- Immutable audit trail of all XP events. Used for analytics and anti-cheat.
CREATE TABLE IF NOT EXISTS public.xp_ledger (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount     integer NOT NULL,
  reason     text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_xp_user ON public.xp_ledger(user_id);


-- ============================================================================
-- SECTION 2: VIEWS
-- ============================================================================

-- Leaderboard
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
  u.id,
  u.wallet_address,
  u.user_name,
  u.trading_level,
  u.xp,
  COUNT(DISTINCT b.id) AS badges_earned,
  COUNT(DISTINCT q.id) AS quizzes_taken,
  u.created_at
FROM public.users u
LEFT JOIN public.user_badges b ON b.user_id = u.id
LEFT JOIN public.quiz_scores q ON q.user_id = u.id
GROUP BY u.id, u.wallet_address, u.user_name, u.trading_level, u.xp, u.created_at
ORDER BY u.xp DESC;


-- ============================================================================
-- SECTION 3: ROW LEVEL SECURITY
-- ============================================================================
-- Disabled to allow the Supabase anon key to read/write all rows.
-- In production with auth, re-enable and add per-user policies.

ALTER TABLE public.users         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memory   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_scores   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_ledger     DISABLE ROW LEVEL SECURITY;


-- ============================================================================
-- SECTION 4: REFERENCE QUERIES (not executed)
-- ============================================================================

-- Get user profile with all badges:
-- SELECT u.*, array_agg(b.badge_name) AS badges
-- FROM public.users u
-- LEFT JOIN public.user_badges b ON b.user_id = u.id
-- WHERE u.wallet_address = 'inj1...'
-- GROUP BY u.id;

-- Get recent chat history for AI context window:
-- SELECT role, content FROM public.chat_messages
-- WHERE user_id = '...' AND context = 'onboarding'
-- ORDER BY created_at DESC LIMIT 50;

-- Get all AI memory for a user:
-- SELECT memory_key, memory_value FROM public.user_memory
-- WHERE user_id = '...';

-- Award XP atomically:
-- BEGIN;
--   UPDATE public.users SET xp = xp + 25, updated_at = NOW() WHERE id = '...';
--   INSERT INTO public.xp_ledger (user_id, amount, reason) VALUES ('...', 25, 'quiz_correct');
-- COMMIT;

-- Get trade history for portfolio page:
-- SELECT * FROM public.trades
-- WHERE user_id = '...'
-- ORDER BY executed_at DESC;
