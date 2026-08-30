import { db } from "@/lib/db";
import { books, chapters } from "@/lib/db/schema";
import { AppShell } from "@/components/app-shell";
import { ArrowRight, BookOpen, FileText, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { wordCount } from "@/lib/utils";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  await requireSession("/");
  const library = await db.select().from(books).orderBy(desc(books.updatedAt));
  const allChapters = await db.select().from(chapters);
  const totalWords = allChapters.reduce((sum, chapter) => sum + wordCount(chapter.content), 0);

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-10 lg:py-14">
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-sm font-medium text-black/45">Welcome to your writers’ sanctuary</p>
            <h1 className="text-4xl font-semibold tracking-[-.05em] md:text-5xl">
              Every story deserves a home.
            </h1>
            <p className="mt-3 max-w-xl text-black/55">
              DigiKatha is your private creative hub to imagine freely, write deeply, and bring every story to life.
            </p>
          </div>
          <Link href="/books/new" className="primary-btn"><Plus size={18} />Start a new story</Link>
        </div>

        <div className="mb-12 grid gap-4 md:grid-cols-[1.55fr_.8fr_.8fr]">
          <Link href="/books/new" className="group rounded-[28px] bg-[#20211f] p-7 text-white shadow-xl shadow-black/10 transition hover:-translate-y-0.5">
            <div className="mb-14 flex items-start justify-between">
              <span className="grid size-12 place-items-center rounded-2xl bg-[#d9f45f] text-black"><Sparkles size={22} /></span>
              <ArrowRight className="transition group-hover:translate-x-1" />
            </div>
            <h2 className="text-2xl font-semibold tracking-[-.04em]">What story is calling you?</h2>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Begin with a spark. DigiKatha will help shape the premise, outline, and first chapter.
            </p>
          </Link>
          <div className="metric"><BookOpen /><strong>{totalWords.toLocaleString()}</strong><span>Words nurtured</span></div>
          <div className="metric"><FileText /><strong>{allChapters.length}</strong><span>Chapters in progress</span></div>
        </div>

        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-[-.03em]">Your story shelf</h2>
          <span className="text-sm text-black/40">{library.length} projects</span>
        </div>
        {library.length === 0 ? (
          <div className="panel grid min-h-64 place-items-center p-8 text-center">
            <div>
              <BookOpen className="mx-auto mb-4 text-black/25" size={36} />
              <h3 className="text-xl font-semibold">Your first katha begins here</h3>
              <p className="mt-2 text-sm text-black/50">Plant an idea and shape it into a complete, editable outline.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {library.map((book, index) => {
              const own = allChapters.filter((chapter) => chapter.bookId === book.id);
              const words = own.reduce((sum, chapter) => sum + wordCount(chapter.content), 0);
              const progress = own.length ? Math.round(own.filter((chapter) => chapter.content.length > 100).length / own.length * 100) : 0;
              return (
                <Link key={book.id} href={`/books/${book.id}`} className="book-card">
                  <div className={`grid h-40 w-28 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${index % 2 ? "from-emerald-200 to-teal-100" : "from-amber-200 to-orange-100"} px-3 text-center shadow-md`}>
                    <span className="font-serif text-lg font-bold leading-tight">{book.title}</span>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col py-1">
                    <span className="text-xs font-semibold uppercase tracking-widest text-black/35">{book.genre}</span>
                    <h3 className="mt-2 truncate text-2xl font-semibold tracking-[-.035em]">{book.title}</h3>
                    <p className="mt-1 text-sm text-black/45">{words.toLocaleString()} words · {own.length} chapters</p>
                    <div className="mt-auto">
                      <div className="mb-2 flex justify-between text-xs font-medium"><span>Manuscript progress</span><span>{progress}%</span></div>
                      <div className="h-1.5 rounded-full bg-black/8"><div className="h-full rounded-full bg-[#20211f]" style={{ width: `${progress}%` }} /></div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </AppShell>
  );
}
