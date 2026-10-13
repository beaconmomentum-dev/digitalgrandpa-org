PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS checkout_attempts (
  checkout_attempt_id TEXT PRIMARY KEY,
  payment_intent_id TEXT UNIQUE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  policy_accepted INTEGER NOT NULL CHECK (policy_accepted IN (0, 1)),
  status TEXT NOT NULL CHECK (status IN ('created', 'payment_intent_created', 'payment_intent_failed', 'fulfilled')),
  highlevel_contact_id TEXT,
  highlevel_enrollment_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stripe_events (
  event_id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_checkout_attempts_payment_intent ON checkout_attempts(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_checkout_attempts_email ON checkout_attempts(email);
