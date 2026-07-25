-- Client portal view tracking (first/last/count). Admin previews do not increment these.
ALTER TABLE invoices ADD COLUMN first_viewed_at TEXT;
ALTER TABLE invoices ADD COLUMN last_viewed_at TEXT;
ALTER TABLE invoices ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;
