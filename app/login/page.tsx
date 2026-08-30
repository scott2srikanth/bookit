import { Feather, LockKeyhole } from "lucide-react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; returnTo?: string }>;
}) {
  if (await getSession()) redirect("/");
  const query = await searchParams;
  const returnTo = query.returnTo?.startsWith("/") && !query.returnTo.startsWith("//") ? query.returnTo : "/";
  return (
    <main className="grid min-h-screen place-items-center bg-[#20211f] px-5 py-12">
      <section className="w-full max-w-md rounded-[28px] bg-[#f7f7f4] p-7 shadow-2xl md:p-9">
        <div className="mb-8">
          <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-[#d9f45f]"><Feather size={21} /></span>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-black/35">Private writers’ sanctuary</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-.045em]">Welcome back to DigiKatha.</h1>
          <p className="mt-3 text-sm leading-6 text-black/50">Sign in to open your story shelf and manuscripts.</p>
        </div>
        {query.error && <div role="alert" className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{query.error === "locked" ? "Too many attempts. Please wait 15 minutes." : query.error === "storage" ? "The private library could not be opened. Check the Cloudflare D1 binding and try again." : "The email or password is incorrect."}</div>}
        <form method="post" action="/api/auth/login" className="space-y-5">
          <input type="hidden" name="returnTo" value={returnTo} />
          <div><label className="label" htmlFor="email">Email</label><input className="field" id="email" name="email" type="email" autoComplete="username" required /></div>
          <div><label className="label" htmlFor="password">Password</label><input className="field" id="password" name="password" type="password" autoComplete="current-password" required minLength={12} /></div>
          <button className="primary-btn w-full" type="submit"><LockKeyhole size={16} />Enter your sanctuary</button>
        </form>
        <p className="mt-6 text-center text-xs leading-5 text-black/35">Protected by encrypted password verification, server-side sessions, and login throttling.</p>
      </section>
    </main>
  );
}
