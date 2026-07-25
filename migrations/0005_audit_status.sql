-- Audit log + invoice status workflow (draft → sent → viewed → paid).
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  meta_json TEXT,
  ip TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_log_at ON audit_log(at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity
  ON audit_log(entity_type, entity_id, at DESC);

ALTER TABLE invoices ADD COLUMN paid_date TEXT;
ALTER TABLE invoices ADD COLUMN sent_at TEXT;

-- Legacy statuses: open → sent; paid stays paid.
UPDATE invoices SET status = 'sent' WHERE lower(status) = 'open';
UPDATE invoices SET status = 'paid' WHERE lower(status) = 'paid';
UPDATE invoices SET status = 'void' WHERE lower(status) = 'void';
UPDATE invoices SET status = 'draft' WHERE lower(status) NOT IN ('draft', 'sent', 'viewed', 'paid', 'void');

-- Mark already-viewed "sent" invoices as viewed (do not touch paid/void).
UPDATE invoices
SET status = 'viewed'
WHERE lower(status) = 'sent'
  AND (first_viewed_at IS NOT NULL OR COALESCE(view_count, 0) > 0);
