"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { endSession, hasSession } from "@/lib/auth";
import { recordCheck } from "@/lib/checker";
import { parseMonitorInput } from "@/lib/monitors";
import { pingUrl } from "@/lib/ping";
import { prisma } from "@/lib/prisma";

export type FormState = { error: string | null };

async function requireSession(): Promise<void> {
  if (!(await hasSession())) {
    redirect("/login");
  }
}

export async function createMonitor(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  await requireSession();

  const parsed = parseMonitorInput(form);

  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const existing = await prisma.monitor.findUnique({
    where: { url: parsed.value.url },
  });

  if (existing) {
    return { error: "That URL is already monitored." };
  }

  await prisma.monitor.create({ data: parsed.value });
  revalidatePath("/dashboard");

  return { error: null };
}

export async function toggleMonitor(id: string): Promise<void> {
  await requireSession();

  const monitor = await prisma.monitor.findUnique({ where: { id } });

  if (!monitor) {
    return;
  }

  await prisma.monitor.update({
    where: { id },
    data: { enabled: !monitor.enabled },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${id}`);
}

export async function deleteMonitor(id: string): Promise<void> {
  await requireSession();

  await prisma.monitor.delete({ where: { id } });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function checkMonitorNow(id: string): Promise<void> {
  await requireSession();

  const monitor = await prisma.monitor.findUnique({ where: { id } });

  if (!monitor) {
    return;
  }

  const result = await pingUrl(monitor.url, monitor.timeoutMs);
  await recordCheck(monitor.id, result);

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${id}`);
}

export async function signOut(): Promise<void> {
  await endSession();
  redirect("/login");
}
