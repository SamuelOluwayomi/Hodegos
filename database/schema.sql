-- ============================================================================
-- HODEGOS DATABASE SCHEMA
-- Stateful AI user profiles, onboarding progress, gamification
-- ============================================================================

-- ── Users table ─────────────────────────────────────────────────────────────
-- Core user identity, linked to wallet address
CREATE TABLE users (
  id              SERIAL PRIMARY KEY,
  wallet_address  VARCHAR(128) NOT NULL UNIQUE,
  user_name       VARCHAR(100),
  ai_tone         VARCHAR(20) DEFAULT 'friendly'
                  CHECK (ai_tone IN ('friendly', 'disciplined', 'straight', 'socratic')),
  trading_level   VARCHAR(20) DEFAULT 'unknown'
                  CHECK (trading_level IN ('unknown', 'beginner', 'intermediate', 'master')),
  xp              INTEGER DEFAULT 0,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  onboarding_step VARCHAR(30) DEFAULT 'welcome',
  demo_completed  BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast wallet lookups
CREATE INDEX idx_users_wallet ON users(wallet_address);

-- ── User Badges ─────────────────────────────────────────────────────────────
-- Track earned badges per user
CREATE TABLE user_badges (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_name  VARCHAR(100) NOT NULL,
  badge_emoji VARCHAR(10),
  earned_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, badge_name)
);

CREATE INDEX idx_badges_user ON user_badges(user_id);

-- ── Quiz Scores ─────────────────────────────────────────────────────────────
-- Track individual quiz attempts and scores
CREATE TABLE quiz_scores (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_type     VARCHAR(30) NOT NULL, -- 'beginner', 'intermediate', 'master', 'onboarding'
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  xp_earned     INTEGER DEFAULT 0,
  completed_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quiz_user ON quiz_scores(user_id);

-- ── Chat History ────────────────────────────────────────────────────────────
-- Persist full conversation history for stateful AI memory
CREATE TABLE chat_messages (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content     TEXT NOT NULL,
  context     VARCHAR(50), -- 'onboarding', 'dashboard', 'trading', etc.
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_user ON chat_messages(user_id);
CREATE INDEX idx_chat_context ON chat_messages(user_id, context);

-- ── User Preferences / Memory ───────────────────────────────────────────────
-- Key-value store for arbitrary AI-remembered facts about the user
-- e.g. "favorite_pair" -> "INJ/USDT", "risk_tolerance" -> "low"
CREATE TABLE user_memory (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  memory_key  VARCHAR(100) NOT NULL,
  memory_value TEXT NOT NULL,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, memory_key)
);

CREATE INDEX idx_memory_user ON user_memory(user_id);

-- ── Demo Trades ─────────────────────────────────────────────────────────────
-- Track simulated (paper) trades during onboarding
CREATE TABLE demo_trades (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pair        VARCHAR(20) NOT NULL, -- e.g. 'INJ/USDT'
  side        VARCHAR(4) NOT NULL CHECK (side IN ('buy', 'sell')),
  order_type  VARCHAR(10) NOT NULL CHECK (order_type IN ('market', 'limit')),
  amount      DECIMAL(18, 8) NOT NULL,
  price       DECIMAL(18, 8) NOT NULL,
  total_value DECIMAL(18, 8) NOT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_demo_user ON demo_trades(user_id);

-- ── XP Ledger ───────────────────────────────────────────────────────────────
-- Audit trail for all XP awards (for leaderboard, analytics, anti-cheat)
CREATE TABLE xp_ledger (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount      INTEGER NOT NULL,
  reason      VARCHAR(200) NOT NULL, -- e.g. 'quiz_correct', 'badge_earned', 'onboarding_step'
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_xp_user ON xp_ledger(user_id);

-- ── Leaderboard View ────────────────────────────────────────────────────────
-- Virtual table for quick leaderboard queries
CREATE VIEW leaderboard AS
SELECT 
  u.id,
  u.wallet_address,
  u.user_name,
  u.trading_level,
  u.
  COUNT(DISTINCT q.id) AS quizzes_taken,
  u.created_at
FROM users u
LEFT JOIN user_badges b ON b.user_id = u.id
LEFT JOIN quiz_scores q ON q.user_id = u.id
GROUP BY u.id, u.wallet_address, u.user_name, u.trading_level, u.xp, u.created_at
ORDER BY u.xp DESC;

-- ============================================================================
-- SAMPLE QUERIES
-- ============================================================================

-- Get user profile with badges:
-- SELECT u.*, array_agg(b.badge_name) as badges
-- FROM users u
-- LEFT JOIN user_badges b ON b.user_id = u.id
-- WHERE u.wallet_address = 'inj1abc...'
-- GROUP BY u.id;

-- Get recent chat history for AI context:
-- SELECT role, content FROM chat_messages
-- WHERE user_id = ? AND context = 'onboarding'
-- ORDER BY created_at DESC LIMIT 50;

-- Get user's AI memories:
-- SELECT memory_key, memory_value FROM user_memory
-- WHERE user_id = ?;

-- Insert XP with ledger:
-- BEGIN;
--   UPDATE users SET xp = xp + 25, updated_at = NOW() WHERE id = ?;
--   INSERT INTO xp_ledger (user_id, amount, reason) VALUES (?, 25, 'quiz_correct');
-- COMMIT;
