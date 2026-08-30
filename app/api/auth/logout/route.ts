import { NextResponse } from "next/server";
import { destroySession, isSameOrigin } from "@/lib/auth";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  await destroySession();
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
