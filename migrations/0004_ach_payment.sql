-- ACH / bank-transfer payment details on invoices + company defaults.
ALTER TABLE invoices ADD COLUMN ach_json TEXT;

CREATE TABLE IF NOT EXISTS billing_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
