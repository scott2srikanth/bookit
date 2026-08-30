import Link from "next/link";
import { BookOpen, Feather, Home, Plus, Settings } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f7f4]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-black/8 bg-[#20211f] p-5 text-white md:flex">
        <Link href="/" className="flex items-center gap-2.5 text-lg font-semibold">
          <span className="grid size-9 place-items-center rounded-xl bg-[#d9f45f] text-black">
            <Feather size={18} />
          </span>
          DigiKatha
        </Link>
        <p className="ml-[46px] mt-1 text-[10px] uppercase tracking-[.18em] text-white/35">
          Writers’ sanctuary
        </p>
        <nav className="mt-9 space-y-1">
          <Link className="side-link" href="/"><Home />Library</Link>
          <Link className="side-link" href="/books/new"><Plus />New story</Link>
        </nav>
        <div className="mt-auto">
          <Link className="side-link" href="/settings"><Settings />Settings</Link>
          <form method="post" action="/api/auth/logout"><button className="side-link w-full" type="submit">Sign out</button></form>
          <div className="mt-4 rounded-2xl bg-white/8 p-4">
            <BookOpen className="mb-3 text-[#d9f45f]" />
            <p className="text-xs leading-5 text-white/55">
              Your quiet corner to imagine, write, and finish stories that matter.
            </p>
          </div>
        </div>
      </aside>
      <div className="md:pl-60">
        <header className="flex h-16 items-center justify-between border-b border-black/8 bg-white/80 px-5 backdrop-blur md:hidden">
          <Link href="/" className="font-semibold">DigiKatha</Link>
          <Link href="/books/new" aria-label="Start a new story"><Plus /></Link>
        </header>
        {children}
      </div>
    </div>
  );
}
