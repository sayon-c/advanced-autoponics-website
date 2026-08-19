-- GeminyIoT alpha access keys (marketing site signup → emailed login key)
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS geminy_keys (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_enc TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  last_sent_at TEXT,
  ip_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_geminy_keys_email
  ON geminy_keys(email COLLATE NOCASE);

CREATE INDEX IF NOT EXISTS idx_geminy_keys_status_created
  ON geminy_keys(status, created_at);

CREATE TABLE IF NOT EXISTS geminy_signup_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_hash TEXT NOT NULL,
  attempted_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_geminy_signup_attempts_ip_time
  ON geminy_signup_attempts(ip_hash, attempted_at);
