// Isomorphic session token signing/verification (works in Node.js API routes
// AND the Edge runtime used by middleware) using the Web Crypto API.

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: "PLAYER" | "ADMIN";
  exp: number; // unix seconds
};

function base64url(input: ArrayBuffer | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(input.length + ((4 - (input.length % 4)) % 4), "=");
  const str = atob(padded);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes;
}

// TS's DOM types want BufferSource backed strictly by ArrayBuffer (not
// SharedArrayBuffer), but some @types/node versions make the global
// Uint8Array generic over ArrayBufferLike, which trips that check even
// though these are always plain, non-shared buffers at runtime. Cast
// through unknown to sidestep the mismatch.
function toBufferSource(bytes: Uint8Array): BufferSource {
  return bytes as unknown as BufferSource;
}

async function getKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    toBufferSource(new TextEncoder().encode(secret)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signToken(payload: SessionPayload, secret: string): Promise<string> {
  const body = base64url(JSON.stringify(payload));
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, toBufferSource(new TextEncoder().encode(body)));
  return `${body}.${base64url(sig)}`;
}

export async function verifyToken(token: string, secret: string): Promise<SessionPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  try {
    const key = await getKey(secret);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      toBufferSource(base64urlDecode(sig)),
      toBufferSource(new TextEncoder().encode(body))
    );
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(body))) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
