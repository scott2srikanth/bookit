import { db } from "@/lib/db";
import { books, chapters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { authorizeApi } from "@/lib/auth";

export async function POST(req: Request) {
  const denied = await authorizeApi(req);
  if (denied) return denied;
  const { chapterId } = await req.json();
  if (typeof chapterId !== "string") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const chapter = (await db.select().from(chapters).where(eq(chapters.id, chapterId)))[0];
  if (!chapter) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const book = (await db.select().from(books).where(eq(books.id, chapter.bookId)))[0];

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      text: "The page waited, open and unhurried. This is your private writing sanctuary—add OPENAI_API_KEY to .env.local when you want DigiKatha to help draft in your voice.",
    });
  }

  const result = await generateText({
    model: openai("gpt-5-mini"),
    system: "You are DigiKatha, a careful creative collaborator. Write original prose, preserve the author’s intent, avoid clichés, and return manuscript text only.",
    prompt: `Book: ${book.title}\nGenre: ${book.genre}\nTone: ${book.tone}\nPremise: ${book.premise}\nChapter: ${chapter.title}\nChapter goal: ${chapter.summary}\nExisting text: ${chapter.content.slice(-4000)}\nContinue with 500-700 polished words.`,
  });
  return NextResponse.json({ text: result.text });
}
