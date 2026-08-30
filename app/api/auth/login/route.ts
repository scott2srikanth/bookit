import { NextResponse } from "next/server";
import { authConfig, checkLoginRateLimit, clearLoginFailures, createSession, loginRateLimitKey, recordLoginFailure, verifyPassword } from "@/lib/auth";

const FALLBACK_PASSWORD_HASH = "310000$5aMtyXSyhGiWdA8QO_Qz_g$Qbjv40-62jboKcDVkSazJuUgktPv83k1Ht3yH4PYGvU";

export async function POST(request: Request) {
  const key = await loginRateLimitKey();
  const limit = await checkLoginRateLimit(key);
  if (!limit.allowed) return NextResponse.redirect(new URL("/login?error=locked", request.url), 303);
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 254);
  const password = String(form.get("password") ?? "").slice(0, 256);
  const requested = String(form.get("returnTo") ?? "/");
  const returnTo = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/";
  const config = authConfig();
  const passwordValid = await verifyPassword(password, config.passwordHash ?? FALLBACK_PASSWORD_HASH);
  const valid = Boolean(config.email && config.passwordHash && email === config.email && passwordValid);
  if (!valid) {
    await recordLoginFailure(key);
    return NextResponse.redirect(new URL(`/login?error=invalid&returnTo=${encodeURIComponent(returnTo)}`, request.url), 303);
  }
  await clearLoginFailures(key);
  await createSession(email);
  return NextResponse.redirect(new URL(returnTo, request.url), 303);
}

export function GET(request: Request) {
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
