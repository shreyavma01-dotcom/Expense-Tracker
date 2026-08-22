-- Expense Tracker schema
-- Idempotent: safe to run multiple times.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uuid UUID DEFAULT gen_random_uuid()
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (
    type IN ('income', 'expense', 'Income', 'Expense')
  ),
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  category VARCHAR(100) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------
-- Migration for databases created before per-user data isolation.
-- Adds ownership to any existing transactions table that predates it.
-- Safe to run repeatedly.
-- ------------------------------------------------------------------

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Backfill: rows created before isolation have no owner. They are assigned
-- to the earliest registered account instead of being deleted. If your
-- database has legacy rows that belong to a different account, reassign
-- them manually BEFORE running this migration.
UPDATE transactions
SET user_id = (SELECT MIN(id) FROM users)
WHERE user_id IS NULL;

-- Enforce NOT NULL once every row has an owner (no-op on fresh installs).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'transactions'
      AND column_name = 'user_id'
      AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE transactions ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- Indexes are created after the column-existence migration above.
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);


