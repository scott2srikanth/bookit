import { db } from "@/lib/db";
import { books, chapters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { authorizeApi } from "@/lib/auth";

const Input = z.object({
  chapterId: z.string().min(1),
  transcript: z.string().trim().min(5).max(20_000),
});

const VoiceResult = z.object({
  manuscriptAddition: z.string(),
  response: z.string(),
  questions: z.array(z.string()).max(3),
  suggestions: z.array(z.string()).max(3),
});

export async function POST(request: Request) {
  const denied = await authorizeApi(request);
  if (denied) return denied;
  const parsed = Input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid voice note" }, { status: 400 });
  const chapter = (await db.select().from(chapters).where(eq(chapters.id, parsed.data.chapterId)))[0];
  if (!chapter) return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  const book = (await db.select().from(books).where(eq(books.id, chapter.bookId)))[0];
  if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(localReflection(parsed.data.transcript));
  }

  try {
    const result = await generateText({
      model: openai("gpt-5-mini"),
      system: `You are DigiKatha's Voice Muse, a warm, perceptive literary collaborator. Preserve the writer's meaning and voice. Never claim authorship. Return valid JSON only with these keys: manuscriptAddition (polished prose based strictly on the spoken thought, using natural paragraphs separated by blank lines), response (2-3 warm sentences reflecting on what is compelling or unclear), questions (1-3 concise craft questions), suggestions (1-3 actionable improvements). Do not use Markdown and do not wrap the JSON in markdown.`,
      prompt: `BOOK TITLE: ${book.title}\nWRITING LANGUAGE: ${book.language}\nGENRE: ${book.genre}\nTONE: ${book.tone}\nPREMISE: ${book.premise}\nCHAPTER: ${chapter.title}\nCHAPTER GOAL: ${chapter.summary}\nRECENT MANUSCRIPT: ${chapter.content.slice(-5000)}\nWRITER'S SPOKEN THOUGHTS: ${parsed.data.transcript}\nWrite the manuscript addition and your response in ${book.language}.`,
    });
    const json = result.text.replace(/^\s*```(?:json)?|```\s*$/g, "").trim();
    const output = VoiceResult.parse(JSON.parse(json));
    return NextResponse.json({ ...output, mode: "ai" as const });
  } catch {
    return NextResponse.json(localReflection(parsed.data.transcript));
  }
}

function localReflection(transcript: string) {
  const cleaned = transcript.replace(/\s+/g, " ").trim();
  const manuscriptAddition = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).replace(/([^.!?])$/, "$1.");
  const words = cleaned.split(/\s+/).length;
  const questions = [
    "What does the central character want most in this moment?",
    "What changes for the reader or character because of this idea?",
  ];
  const suggestions = [
    words < 35 ? "Add one concrete sensory detail so the moment feels lived-in." : "Break the idea into a scene beat, a reaction, and a consequence.",
    "Replace one abstract statement with a specific image, action, or line of dialogue.",
  ];
  return {
    manuscriptAddition,
    response: "There is a clear story impulse here. I shaped your spoken thought into a clean passage while keeping its original meaning; the questions below can help you uncover the emotional center.",
    questions,
    suggestions,
    mode: "local" as const,
  };
}
