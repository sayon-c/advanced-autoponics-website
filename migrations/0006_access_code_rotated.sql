-- Track when a client access code was last created/rotated (plaintext still never stored).
PRAGMA foreign_keys = ON;

ALTER TABLE clients ADD COLUMN access_code_rotated_at TEXT;
