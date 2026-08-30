import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-digikatha_session" : "digikatha_session";
const SESSION_SECONDS = 60 * 60 * 24 * 30;

type SessionRow = { email: string; expires_at: number };

function env() {
  return getCloudflareContext().env;
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

export async function verifyPassword(password: string, encoded: string) {
  const [iterationsText, saltText, expectedText] = encoded.split("$");
  const iterations = Number(iterationsText);
  if (!Number.isSafeInteger(iterations) || iterations < 210_000 || !saltText || !expectedText) return false;
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: base64UrlToBytes(saltText), iterations },
    material,
    256,
  );
  return constantTimeEqual(new Uint8Array(derived), base64UrlToBytes(expectedText));
}

export async function createSession(email: string) {
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = bytesToBase64Url(tokenBytes);
  const tokenHash = await sha256(token);
  const now = Date.now();
  const expiresAt = now + SESSION_SECONDS * 1000;
  await env().DB.prepare(
    "INSERT INTO sessions (id, token_hash, email, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).bind(crypto.randomUUID(), tokenHash, email, now, expiresAt, now).run();
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS,
    priority: "high",
  });
}

export async function getSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length < 32) return null;
  const tokenHash = await sha256(token);
  const session = await env().DB.prepare(
    "SELECT email, expires_at FROM sessions WHERE token_hash = ? AND expires_at > ? LIMIT 1",
  ).bind(tokenHash, Date.now()).first<SessionRow>();
  return session ? { email: session.email, expiresAt: session.expires_at } : null;
}

export async function requireSession(returnTo = "/") {
  const session = await getSession();
  if (!session) redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  return session;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await env().DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  store.delete(SESSION_COOKIE);
}

export async function loginRateLimitKey() {
  const requestHeaders = await headers();
  const ip = requestHeaders.get("cf-connecting-ip") ?? requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  return sha256(ip);
}

export async function checkLoginRateLimit(key: string) {
  const now = Date.now();
  const row = await env().DB.prepare(
    "SELECT attempts, window_started_at, blocked_until FROM login_attempts WHERE key = ?",
  ).bind(key).first<{ attempts: number; window_started_at: number; blocked_until: number | null }>();
  if (!row) return { allowed: true, retryAfter: 0 };
  if (row.blocked_until && row.blocked_until > now) return { allowed: false, retryAfter: Math.ceil((row.blocked_until - now) / 1000) };
  return { allowed: true, retryAfter: 0 };
}

export async function recordLoginFailure(key: string) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const row = await env().DB.prepare(
    "SELECT attempts, window_started_at FROM login_attempts WHERE key = ?",
  ).bind(key).first<{ attempts: number; window_started_at: number }>();
  const attempts = !row || now - row.window_started_at > windowMs ? 1 : row.attempts + 1;
  const windowStartedAt = !row || now - row.window_started_at > windowMs ? now : row.window_started_at;
  const blockedUntil = attempts >= 5 ? now + windowMs : null;
  await env().DB.prepare(
    "INSERT INTO login_attempts (key, attempts, window_started_at, blocked_until) VALUES (?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET attempts=excluded.attempts, window_started_at=excluded.window_started_at, blocked_until=excluded.blocked_until",
  ).bind(key, attempts, windowStartedAt, blockedUntil).run();
}

export async function clearLoginFailures(key: string) {
  await env().DB.prepare("DELETE FROM login_attempts WHERE key = ?").bind(key).run();
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return request.method === "GET" || request.method === "HEAD";
  try {
    const originUrl = new URL(origin);
    const expectedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? new URL(request.url).host;
    const expectedProtocol = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");
    return originUrl.host === expectedHost && originUrl.protocol === `${expectedProtocol}:`;
  } catch {
    return false;
  }
}

export function authConfig() {
  const { AUTH_EMAIL, AUTH_PASSWORD_HASH } = env();
  return { email: AUTH_EMAIL?.trim().toLowerCase(), passwordHash: AUTH_PASSWORD_HASH };
}

export async function authorizeApi(request: Request, requireOrigin = true) {
  if (requireOrigin && !isSameOrigin(request)) {
    return new Response(JSON.stringify({ error: "Invalid origin" }), { status: 403, headers: { "content-type": "application/json" } });
  }
  if (!await getSession()) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "content-type": "application/json" } });
  }
  return null;
}
