-- ============================================================================
-- HODEGOS REAL TRADES TABLE SCHEMA
-- Records real trades executed on-chain (Injective Testnet)
-- ============================================================================

CREATE TABLE IF NOT EXISTS trades (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pair        VARCHAR(20) NOT NULL, -- e.g. 'INJ/USDT', 'SOL/USDT'
  side        VARCHAR(4) NOT NULL CHECK (side IN ('buy', 'sell')),
  order_type  VARCHAR(10) NOT NULL CHECK (order_type IN ('market', 'limit')),
  amount      DECIMAL(18, 8) NOT NULL,
  price       DECIMAL(18, 8) NOT NULL,
  total_value DECIMAL(18, 8) NOT NULL,
  tx_hash     VARCHAR(128),
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trades_user ON trades(user_id);
