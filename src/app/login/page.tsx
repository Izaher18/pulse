import Link from "next/link";
import { redirect } from "next/navigation";
import { hasSession } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (await hasSession()) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-950 px-6 text-zinc-100">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Pulse
        </Link>
        <h1 className="mt-8 text-2xl font-semibold tracking-tight">
          Sign in to the dashboard
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Monitors and check history are private. Status pages stay public.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
