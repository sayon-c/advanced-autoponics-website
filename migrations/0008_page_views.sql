-- First-party site analytics (public pages). No raw IPs stored.
CREATE TABLE IF NOT EXISTS page_views (
  id TEXT PRIMARY KEY,
  at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  path TEXT NOT NULL,
  referrer TEXT,
  country TEXT,
  city TEXT,
  visitor_id TEXT NOT NULL,
  ua_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_page_views_at ON page_views(at);
CREATE INDEX IF NOT EXISTS idx_page_views_path_at ON page_views(path, at);
CREATE INDEX IF NOT EXISTS idx_page_views_country_at ON page_views(country, at);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_at ON page_views(visitor_id, at);
