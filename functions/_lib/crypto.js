const textEncoder = new TextEncoder();

function toBase64Url(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(str) {
  const pad = '='.repeat((4 - (str.length % 4)) % 4);
  const b64 = (str + pad).replace(/-/g, '+').replace(/_/g, '/');
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

/** Normalize portal codes: trim, collapse spaces around hyphens, uppercase. */
export function normalizeAccessCode(code) {
  return String(code ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, '');
}

export async function hashAccessCode(code) {
  const normalized = normalizeAccessCode(code);
  const salt = randomBytes(16);
  const iterations = 100000;
  const key = await deriveKey(normalized, salt, iterations);
  const hash = new Uint8Array(await crypto.subtle.exportKey('raw', key));
  return `pbkdf2$${iterations}$${toBase64Url(salt)}$${toBase64Url(hash)}`;
}

export async function verifyAccessCode(code, stored) {
  if (!stored || typeof stored !== 'string') return false;
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations < 10000) return false;
  const salt = fromBase64Url(parts[2]);
  const expected = fromBase64Url(parts[3]);
  const normalized = normalizeAccessCode(code);
  const key = await deriveKey(normalized, salt, iterations);
  const actual = new Uint8Array(await crypto.subtle.exportKey('raw', key));
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  // Legacy hashes may have been stored before normalization — try raw trimmed input once.
  if (diff !== 0) {
    const raw = String(code ?? '').trim();
    if (raw && raw !== normalized) {
      const keyRaw = await deriveKey(raw, salt, iterations);
      const actualRaw = new Uint8Array(await crypto.subtle.exportKey('raw', keyRaw));
      if (actualRaw.length === expected.length) {
        let diffRaw = 0;
        for (let i = 0; i < actualRaw.length; i++) diffRaw |= actualRaw[i] ^ expected[i];
        return diffRaw === 0;
      }
    }
    return false;
  }
  return true;
}

async function deriveKey(code, salt, iterations) {
  const base = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(String(code)),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    base,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    true,
    ['sign']
  );
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signSession(payload, secret) {
  const body = toBase64Url(textEncoder.encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const sig = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, textEncoder.encode(body))
  );
  return `${body}.${toBase64Url(sig)}`;
}

export async function verifySession(token, secret) {
  if (!token || typeof token !== 'string') return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const key = await hmacKey(secret);
  const ok = await crypto.subtle.verify(
    'HMAC',
    key,
    fromBase64Url(sig),
    textEncoder.encode(body)
  );
  if (!ok) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body)));
    if (!payload?.cid || !payload?.exp) return null;
    if (Date.now() > Number(payload.exp)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function hashIp(ip) {
  const data = textEncoder.encode(ip || 'unknown');
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toBase64Url(new Uint8Array(digest));
}

export function newId(prefix = '') {
  const id = toBase64Url(randomBytes(12));
  return prefix ? `${prefix}_${id}` : id;
}

/** Generate a one-time portal code like ORG-EYUB-75YD (plaintext shown once; only hash is stored). */
export function generateAccessCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const pick = (n) => {
    const bytes = randomBytes(n);
    let out = '';
    for (let i = 0; i < n; i++) out += alphabet[bytes[i] % alphabet.length];
    return out;
  };
  return `ORG-${pick(4)}-${pick(4)}`;
}
