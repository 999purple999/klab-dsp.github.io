// ─── Minimal JWT sign/verify using Web Crypto ─────────────────────────────────
// HMAC-SHA256 HS256 tokens. Workers runtime supports SubtleCrypto natively.

const ALG  = { name: 'HMAC', hash: 'SHA-256' };
const ENC  = new TextEncoder();

function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function b64urlDecode(str) {
  const s = str.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}

async function _importKey(secret) {
  return crypto.subtle.importKey('raw', ENC.encode(secret), ALG, false, ['sign', 'verify']);
}

/** Sign a payload object. Returns a compact JWT string. */
export async function sign(payload, secret) {
  const header  = b64url(ENC.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body    = b64url(ENC.encode(JSON.stringify(payload)));
  const sigInput = header + '.' + body;
  const key     = await _importKey(secret);
  const sig     = await crypto.subtle.sign(ALG, key, ENC.encode(sigInput));
  return sigInput + '.' + b64url(sig);
}

/** Verify a JWT and return its payload, or throw on failure. */
export async function verify(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT structure');

  const [headerB64, bodyB64, sigB64] = parts;
  const key      = await _importKey(secret);
  const sigInput = headerB64 + '.' + bodyB64;
  const valid    = await crypto.subtle.verify(ALG, key, b64urlDecode(sigB64), ENC.encode(sigInput));
  if (!valid) throw new Error('Invalid JWT signature');

  const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(bodyB64)));
  if (payload.exp && payload.exp < Date.now()) throw new Error('JWT expired');
  return payload;
}
