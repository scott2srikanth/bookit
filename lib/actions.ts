"use server";

import { db } from "@/lib/db";
import { books, chapters, storyItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";

const BookInput = z.object({
  title: z.string().trim().min(2).max(120),
  premise: z.string().trim().min(10).max(4000),
  genre: z.string().max(80),
  audience: z.string().max(80),
  tone: z.string().max(80),
  language: z.string().max(50),
});

export async function createBook(formData: FormData) {
  await requireSession("/books/new");
  const parsed = BookInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Please complete the title and premise.");
  const id = crypto.randomUUID();
  const now = new Date();
  await db.insert(books).values({ id, ...parsed.data, createdAt: now, updatedAt: now });
  const outline = ["Opening: The promise", "The world before", "The first turning point", "Pressure and discovery", "The midpoint shift", "Consequences", "The final test", "A new beginning"];
  await db.insert(chapters).values(outline.map((title, index) => ({
    id: crypto.randomUUID(), bookId: id, position: index + 1, title,
    summary: index === 0 ? parsed.data.premise : "Shape this chapter around the central promise of the book.",
    createdAt: now, updatedAt: now,
  })));
  redirect(`/books/${id}`);
}

export async function addChapter(bookId: string) {
  await requireSession(`/books/${bookId}`);
  const list = await db.select().from(chapters).where(eq(chapters.bookId, bookId));
  const now = new Date();
  await db.insert(chapters).values({ id: crypto.randomUUID(), bookId, position: list.length + 1, title: `Chapter ${list.length + 1}`, createdAt: now, updatedAt: now });
  revalidatePath(`/books/${bookId}`);
}

export async function addStoryItem(bookId: string, formData: FormData) {
  await requireSession(`/books/${bookId}/story-bible`);
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const now = new Date();
  await db.insert(storyItems).values({ id: crypto.randomUUID(), bookId, type: String(formData.get("type") || "character"), name, description: String(formData.get("description") || "").slice(0, 2000), createdAt: now, updatedAt: now });
  revalidatePath(`/books/${bookId}/story-bible`);
}

export async function updatePublishing(bookId: string, formData: FormData) {
  await requireSession(`/books/${bookId}/publishing`);
  await db.update(books).set({
    subtitle: String(formData.get("subtitle") || "").slice(0, 180),
    description: String(formData.get("description") || "").slice(0, 5000),
    keywords: JSON.stringify(String(formData.get("keywords") || "").split(",").map((item) => item.trim()).filter(Boolean).slice(0, 7)),
    updatedAt: new Date(),
  }).where(eq(books.id, bookId));
  revalidatePath(`/books/${bookId}/publishing`);
}
