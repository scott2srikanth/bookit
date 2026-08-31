"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, Download, Library, Menu, PanelLeft, Plus, Users, X } from "lucide-react";
import { addChapter } from "@/lib/actions";

export function BookNav({ book, chapters }: {
  book: { id: string; title: string };
  chapters: { id: string; title: string; position: number }[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" onClick={() => setOpen(true)} className="fixed left-3 top-3 z-30 grid size-10 place-items-center rounded-xl border border-black/10 bg-white shadow-md lg:hidden" aria-label="Open book navigation" aria-expanded={open}><Menu size={19} /></button>
    {open && <button type="button" aria-label="Close book navigation" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px] lg:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-[min(86vw,18rem)] shrink-0 flex-col border-r border-black/8 bg-[#f3f3ef] shadow-2xl transition-transform duration-200 lg:static lg:z-auto lg:w-72 lg:translate-x-0 lg:shadow-none ${open ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="border-b border-black/8 p-4">
        <div className="mb-4 flex items-center justify-between"><Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2 text-xs font-medium text-black/45 hover:text-black"><ChevronLeft size={15} />Library</Link><button type="button" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-xl hover:bg-black/5 lg:hidden" aria-label="Close navigation"><X size={18} /></button></div>
        <h2 className="truncate font-semibold tracking-[-.02em]">{book.title}</h2>
      </div>
      <nav className="border-b border-black/8 p-3"><Link onClick={() => setOpen(false)} className="workspace-link" href={`/books/${book.id}`}><PanelLeft />Outline</Link><Link onClick={() => setOpen(false)} className="workspace-link" href={`/books/${book.id}/story-bible`}><Users />Story bible</Link><Link onClick={() => setOpen(false)} className="workspace-link" href={`/books/${book.id}/publishing`}><Download />Publish & export</Link></nav>
      <div className="flex items-center justify-between px-4 pb-2 pt-4"><span className="text-[11px] font-bold uppercase tracking-widest text-black/35">Manuscript</span><form action={addChapter.bind(null, book.id)}><button className="grid size-8 place-items-center rounded-lg hover:bg-black/5" aria-label="Add chapter"><Plus size={16} /></button></form></div>
      <div className="flex-1 overflow-y-auto px-2 pb-4">{chapters.map((chapter) => <Link onClick={() => setOpen(false)} key={chapter.id} href={`/books/${book.id}/chapters/${chapter.id}`} className={`chapter-link ${pathname.includes(`/chapters/${chapter.id}`) ? "active" : ""}`}><span>{String(chapter.position).padStart(2, "0")}</span><p>{chapter.title}</p></Link>)}</div>
      <div className="border-t border-black/8 p-3"><Link onClick={() => setOpen(false)} className="workspace-link" href="/"><Library />All books</Link></div>
    </aside>
  </>;
}
