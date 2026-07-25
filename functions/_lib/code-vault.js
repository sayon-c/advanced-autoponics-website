/**
 * Admin-only reversible storage for portal access codes.
 * Ciphertext is AES-GCM; key derived from ADMIN_SECRET via PBKDF2
 * (or CODE_VAULT_SECRET when set — see INVOICES.md).
 */
import { normalizeAccessCode } from './crypto.js';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const VAULT_SALT = textEncoder.encode('autoponics-access-code-vault-v1');

function toBase64Url(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(str) {
  const pad = '='.repeat((4 - (String(str).length % 4)) % 4);
  const b64 = (String(str) + pad).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function randomBytes(n) {
  const buf = new Uint8Array(n);
  crypto.getRandomValues(buf);
  return buf;
}

/** Prefer CODE_VAULT_SECRET; fall back to ADMIN_SECRET. */
export function vaultSecret(env) {
  const dedicated = String(env?.CODE_VAULT_SECRET || '').trim();
  if (dedicated) return dedicated;
  return String(env?.ADMIN_SECRET || '').trim();
}

async function deriveVaultKey(secret) {
  const material = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(String(secret)),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: VAULT_SALT, iterations: 100000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * @returns {Promise<string|null>} v1$iv$ciphertext (base64url) or null if no secret/code
 */
export async function encryptAccessCode(plaintext, secret) {
  const code = normalizeAccessCode(plaintext);
  const keyMaterial = String(secret || '').trim();
  if (!code || !keyMaterial) return null;
  const key = await deriveVaultKey(keyMaterial);
  const iv = randomBytes(12);
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      textEncoder.encode(code)
    )
  );
  return `v1$${toBase64Url(iv)}$${toBase64Url(cipher)}`;
}

/**
 * @returns {Promise<string|null>} plaintext code or null
 */
export async function decryptAccessCode(blob, secret) {
  const keyMaterial = String(secret || '').trim();
  if (!blob || !keyMaterial) return null;
  const parts = String(blob).split('$');
  if (parts.length !== 3 || parts[0] !== 'v1') return null;
  try {
    const iv = fromBase64Url(parts[1]);
    const data = fromBase64Url(parts[2]);
    const key = await deriveVaultKey(keyMaterial);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return normalizeAccessCode(textDecoder.decode(plain));
  } catch {
    return null;
  }
}
