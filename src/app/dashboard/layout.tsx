import Link from "next/link";
import { redirect } from "next/navigation";
import { hasSession } from "@/lib/auth";
import { signOut } from "./actions";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  if (!(await hasSession())) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-900">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Pulse
          </Link>
          <div className="flex items-center gap-5 text-sm text-zinc-400">
            <Link className="transition-colors hover:text-zinc-100" href="/">
              Landing page
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="transition-colors hover:text-zinc-100"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
