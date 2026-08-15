import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "tae_admin";
const MAX_AGE_SECONDS = 60 * 60 * 12; // una jornada de funciones

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) {
    throw new Error(
      "AUTH_SECRET falta o es muy corto. Generá uno con: openssl rand -hex 32",
    );
  }
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

/** Comparacion en tiempo constante, tolerante a largos distintos. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Token = `<expiraEnMs>.<hmac>`. Sin estado en la base. */
function mintToken(): string {
  const expiresAt = String(Date.now() + MAX_AGE_SECONDS * 1000);
  return `${expiresAt}.${sign(expiresAt)}`;
}

function isValidToken(token: string | undefined): boolean {
  if (!token) return false;

  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature) return false;
  if (!safeEqual(signature, sign(expiresAt))) return false;

  return Number(expiresAt) > Date.now();
}

export function checkPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error("ADMIN_PASSWORD no está configurado.");
  }
  return safeEqual(candidate, expected);
}

export async function startAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, mintToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return isValidToken(store.get(COOKIE)?.value);
}

/** Para usar al principio de cada server action del panel. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error("No autorizado.");
  }
}
