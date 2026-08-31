import { db } from "@/lib/db";
import { books } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeApi } from "@/lib/auth";

const Input = z.object({ language: z.enum(["English", "Hindi", "Telugu"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ bookId: string }> }) {
  const denied = await authorizeApi(request);
  if (denied) return denied;
  const parsed = Input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  const { bookId } = await params;
  const current = (await db.select({ id: books.id }).from(books).where(eq(books.id, bookId)))[0];
  if (!current) return NextResponse.json({ error: "Book not found" }, { status: 404 });
  await db.update(books).set({ language: parsed.data.language, updatedAt: new Date() }).where(eq(books.id, bookId));
  return NextResponse.json({ ok: true, language: parsed.data.language });
}
