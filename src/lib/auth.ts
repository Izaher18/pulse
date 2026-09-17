import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "pulse_session";

const SESSION_TTL_SECONDS = 60 * 60 * 12;

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set`);
  }

  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", requiredEnv("SESSION_SECRET"))
    .update(payload)
    .digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export function isPasswordCorrect(password: string): boolean {
  return safeEqual(password, requiredEnv("DASHBOARD_PASSWORD"));
}

function createToken(): string {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  return `${expiresAt}.${sign(String(expiresAt))}`;
}

function isValidToken(token: string): boolean {
  const [expiresAt, signature] = token.split(".");

  if (!expiresAt || !signature) {
    return false;
  }

  if (!safeEqual(signature, sign(expiresAt))) {
    return false;
  }

  return Number(expiresAt) > Date.now();
}

export async function startSession(): Promise<void> {
  const store = await cookies();

  store.set(SESSION_COOKIE, createToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function hasSession(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  return token ? isValidToken(token) : false;
}
