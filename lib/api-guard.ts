import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

export const GUARD_CHALLENGE = 'Basic realm="triply-api", charset="UTF-8"';

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(digest(a), digest(b));
}

function getGuardCredentials(): { username: string; password: string } | null {
  const username = process.env.API_GUARD_USERNAME || process.env.NEXT_PUBLIC_AUTH_USERNAME;
  const password = process.env.API_GUARD_PASSWORD || process.env.NEXT_PUBLIC_AUTH_PASSWORD;
  if (!username || !password) return null;
  return { username, password };
}

export function hasGuardHeader(request: Request): boolean {
  return /^Basic\s+/i.test(request.headers.get("authorization") ?? "");
}

export function verifyApiGuard(request: Request): boolean {
  const credentials = getGuardCredentials();
  if (!credentials) return false;

  const match = /^Basic\s+(.+)$/i.exec(request.headers.get("authorization") ?? "");
  if (!match) return false;

  const decoded = Buffer.from(match[1], "base64").toString("utf8");
  const separator = decoded.indexOf(":");
  if (separator < 0) return false;

  const usernameOk = safeEqual(decoded.slice(0, separator), credentials.username);
  const passwordOk = safeEqual(decoded.slice(separator + 1), credentials.password);
  return usernameOk && passwordOk;
}