-- Encrypted access-code vault for admin reveal (AES-GCM ciphertext).
-- Login still uses access_code_hash only; client APIs never see plaintext.
PRAGMA foreign_keys = ON;

ALTER TABLE clients ADD COLUMN access_code_enc TEXT;
