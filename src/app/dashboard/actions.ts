"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { endSession, hasSession } from "@/lib/auth";
import { recordCheck } from "@/lib/checker";
import { parseMonitorInput } from "@/lib/monitors";
import { pingUrl } from "@/lib/ping";
import { prisma } from "@/lib/prisma";
import { availableSlug } from "@/lib/slug";

export type FormState = { error: string | null };

async function requireSession(): Promise<void> {
  if (!(await hasSession())) {
    redirect("/login");
  }
}

// Status pages are cached, so anything that changes a monitor has to clear the
// public render as well as the dashboard.
function revalidateMonitor(monitor: { id: string; slug: string }): void {
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${monitor.id}`);
  revalidatePath("/status");
  revalidatePath(`/status/${monitor.slug}`);
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

  const slug = await availableSlug(
    parsed.value.name,
    async (candidate) =>
      (await prisma.monitor.count({ where: { slug: candidate } })) > 0,
  );

  await prisma.monitor.create({ data: { ...parsed.value, slug } });
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

  revalidateMonitor(monitor);
}

export async function toggleVisibility(id: string): Promise<void> {
  await requireSession();

  const monitor = await prisma.monitor.findUnique({ where: { id } });

  if (!monitor) {
    return;
  }

  await prisma.monitor.update({
    where: { id },
    data: { isPublic: !monitor.isPublic },
  });

  revalidateMonitor(monitor);
}

export async function deleteMonitor(id: string): Promise<void> {
  await requireSession();

  const monitor = await prisma.monitor.delete({ where: { id } });

  revalidateMonitor(monitor);
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

  revalidateMonitor(monitor);
}

export async function signOut(): Promise<void> {
  await endSession();
  redirect("/login");
}
