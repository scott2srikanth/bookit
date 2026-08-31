import { AppShell } from "@/components/app-shell";
import { createBook } from "@/lib/actions";
import { ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { requireSession } from "@/lib/auth";

export default async function NewBook() {
  await requireSession("/books/new");
  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-5 py-10 lg:py-16">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-black/50 hover:text-black">
          <ArrowLeft size={16} />Back to your story shelf
        </Link>
        <div className="mb-9">
          <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-[#d9f45f]"><Sparkles size={21} /></span>
          <h1 className="text-4xl font-semibold tracking-[-.05em]">Let’s give your story a home.</h1>
          <p className="mt-3 text-black/50">Share the raw idea. In this sanctuary, every detail remains yours to shape.</p>
        </div>
        <form action={createBook} className="panel space-y-6 p-6 md:p-8">
          <div>
            <label className="label" htmlFor="title">Working title</label>
            <input className="field text-lg" id="title" name="title" required minLength={2} placeholder="The Quiet Atlas" />
          </div>
          <div>
            <label className="label" htmlFor="premise">What is your story about?</label>
            <textarea className="field min-h-36 resize-y leading-6" id="premise" name="premise" required minLength={10} placeholder="Describe the promise, central conflict, reader transformation, or story you want to tell…" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Select name="genre" label="Genre" values={["Fiction", "Literary fiction", "Fantasy", "Romance", "Mystery & thriller", "Business", "Self-help", "Memoir", "Children's"]} />
            <Select name="audience" label="Audience" values={["Adult", "Young adult", "Middle grade", "Children", "Professional"]} />
            <Select name="tone" label="Writing tone" values={["Engaging", "Warm & conversational", "Literary", "Direct & practical", "Dark & atmospheric", "Playful"]} />
            <Select name="language" label="Writing language" values={["English", "Hindi", "Telugu"]} />
          </div>
          <div className="flex flex-col-reverse items-center justify-between gap-4 border-t border-black/8 pt-6 sm:flex-row">
            <p className="flex items-center gap-2 text-xs text-black/45"><ShieldCheck size={15} />Private by design</p>
            <button className="primary-btn w-full sm:w-auto" type="submit"><Sparkles size={17} />Shape my outline</button>
          </div>
        </form>
      </main>
    </AppShell>
  );
}

function Select({ name, label, values }: { name: string; label: string; values: string[] }) {
  return <div><label className="label" htmlFor={name}>{label}</label><select className="field" id={name} name={name}>{values.map((value) => <option key={value}>{value}</option>)}</select></div>;
}
