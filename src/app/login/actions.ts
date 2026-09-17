"use server";

import { redirect } from "next/navigation";
import { isPasswordCorrect, startSession } from "@/lib/auth";

export type LoginState = { error: string | null };

export async function signIn(
  _prev: LoginState,
  form: FormData,
): Promise<LoginState> {
  const password = String(form.get("password") ?? "");

  if (!password) {
    return { error: "Enter the dashboard password." };
  }

  if (!process.env.DASHBOARD_PASSWORD || !process.env.SESSION_SECRET) {
    return {
      error: "Set DASHBOARD_PASSWORD and SESSION_SECRET in .env, then retry.",
    };
  }

  if (!isPasswordCorrect(password)) {
    return { error: "Wrong password." };
  }

  await startSession();
  redirect("/dashboard");
}
