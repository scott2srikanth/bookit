import { db } from "@/lib/db";
import { books, chapters } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { BookNav } from "@/components/book-nav";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  await requireSession(`/books/${bookId}`);
  const book = (await db.select().from(books).where(eq(books.id, bookId)))[0];
  if (!book) notFound();
  const list = await db.select().from(chapters).where(eq(chapters.bookId, bookId)).orderBy(asc(chapters.position));
  return <div className="flex h-screen overflow-hidden bg-white"><BookNav book={book} chapters={list} /><main className="min-w-0 flex-1 overflow-y-auto">{children}</main></div>;
}
