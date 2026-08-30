import { AppShell } from "@/components/app-shell";
import { Cpu, Database, KeyRound, ShieldCheck } from "lucide-react";
import { requireSession } from "@/lib/auth";

export default async function Settings() {
  await requireSession("/settings");
  return (
    <AppShell>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-4xl font-semibold tracking-[-.05em]">Sanctuary settings</h1>
        <p className="mt-3 text-black/50">DigiKatha is configured as a private, single-writer creative hub.</p>
        <div className="mt-9 grid gap-5">
          <Card icon={<Database />} title="Private library" text="Stories, chapters, versions, and creative notes live in your Cloudflare D1 database. Local development uses an isolated local D1 instance." status="Connected" />
          <Card icon={<ShieldCheck />} title="Privacy and access" text="Every manuscript route requires your single-writer login. Sessions are revocable, rate-limited, and protected by secure cookies; no analytics are installed." status="Protected" />
          <Card icon={<KeyRound />} title="AI collaborator" text="Set OPENAI_API_KEY as a Cloudflare secret to enable chapter drafting. The key stays server-side and is never sent to the browser." status={process.env.OPENAI_API_KEY ? "Ready" : "Optional"} />
          <Card icon={<Cpu />} title="Voice Muse" text="Free browser dictation and natural browser speech work without a key. Literary reflection uses a local mode by default; an API key enables deeper AI analysis and Whisper fallback transcription." status="Optional" />
        </div>
      </main>
    </AppShell>
  );
}

function Card({ icon, title, text, status }: { icon: React.ReactNode; title: string; text: string; status: string }) {
  return <div className="panel flex gap-5 p-6"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#d9f45f] [&_svg]:size-5">{icon}</span><div><h2 className="font-semibold">{title}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-black/50">{text}</p></div><span className="ml-auto h-fit rounded-full bg-black/[.05] px-3 py-1 text-xs font-semibold">{status}</span></div>;
}
