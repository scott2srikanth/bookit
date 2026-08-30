import { NextResponse } from "next/server";
import { authConfig, checkLoginRateLimit, clearLoginFailures, createSession, loginRateLimitKey, recordLoginFailure, verifyPassword } from "@/lib/auth";

const FALLBACK_PASSWORD_HASH = "100000$dhdG2JGg-BTzmOiXahyN_A$G59kxyKA3xF0JQBkJ2fOhnToTsRmk10zw7j_WsQm5pk";

export async function POST(request: Request) {
  let stage = "start";
  try {
    stage = "rate-limit-key";
    const key = await loginRateLimitKey();
    stage = "rate-limit-read";
    const limit = await checkLoginRateLimit(key);
    if (!limit.allowed) return NextResponse.redirect(new URL("/login?error=locked", request.url), 303);
    stage = "form";
    const form = await request.formData();
    const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 254);
    const password = String(form.get("password") ?? "").slice(0, 256);
    const requested = String(form.get("returnTo") ?? "/");
    const returnTo = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/";
    stage = "configuration";
    const config = authConfig();
    stage = "password-verification";
    const passwordValid = await verifyPassword(password, config.passwordHash ?? FALLBACK_PASSWORD_HASH);
    const valid = Boolean(config.email && config.passwordHash && email === config.email && passwordValid);
    if (!valid) {
      stage = "rate-limit-write";
      await recordLoginFailure(key);
      return NextResponse.redirect(new URL(`/login?error=invalid&returnTo=${encodeURIComponent(returnTo)}`, request.url), 303);
    }
    stage = "rate-limit-clear";
    await clearLoginFailures(key);
    stage = "session-create";
    await createSession(email);
    return NextResponse.redirect(new URL(returnTo, request.url), 303);
  } catch (error) {
    console.error("DigiKatha login failed", error);
    return NextResponse.redirect(new URL(`/login?error=storage&stage=${stage}`, request.url), 303);
  }
}

export function GET(request: Request) {
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
