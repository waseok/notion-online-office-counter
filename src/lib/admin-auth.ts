import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "counter_admin_session";
const SESSION_VALUE = "authorized";

function password(): string {
  const value = process.env.COUNTER_ADMIN_PASSWORD;
  if (!value) throw new Error("COUNTER_ADMIN_PASSWORD is not configured.");
  return value;
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

function safeEqual(left: Buffer, right: Buffer): boolean {
  return left.length === right.length && timingSafeEqual(left, right);
}

function sessionToken(): string {
  return createHash("sha256")
    .update(`${SESSION_VALUE}:${password()}`)
    .digest("hex");
}

export function isCorrectAdminPassword(value: string): boolean {
  return safeEqual(digest(value), digest(password()));
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return false;

  return safeEqual(Buffer.from(token), Buffer.from(sessionToken()));
}

export function adminSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: sessionToken(),
    options: {
      httpOnly: true,
      sameSite: "strict" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    },
  };
}

export function adminSessionCookieName(): string {
  return COOKIE_NAME;
}
