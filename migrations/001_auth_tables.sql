-- Durable authentication storage for MailCraft AI (Neon PostgreSQL).
CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  email_normalized TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  password_salt TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  plan TEXT NOT NULL CHECK (plan IN ('free', 'starter', 'pro', 'business')),
  trial_generations_used INTEGER NOT NULL DEFAULT 0 CHECK (trial_generations_used >= 0),
  trial_generations_limit INTEGER NOT NULL DEFAULT 1 CHECK (trial_generations_limit >= 0),
  monthly_generations_used INTEGER NOT NULL DEFAULT 0 CHECK (monthly_generations_used >= 0),
  monthly_generations_limit INTEGER NOT NULL DEFAULT 0 CHECK (monthly_generations_limit >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS app_users_created_at_idx ON app_users (created_at DESC);

-- Store only a SHA-256 digest of the opaque cookie token, never the raw token.
CREATE TABLE IF NOT EXISTS app_sessions (
  token_hash CHAR(64) PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  ip TEXT NOT NULL DEFAULT 'unknown'
);

CREATE INDEX IF NOT EXISTS app_sessions_user_id_idx ON app_sessions (user_id);
CREATE INDEX IF NOT EXISTS app_sessions_expires_at_idx ON app_sessions (expires_at);
