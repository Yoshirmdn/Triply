import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

function safeEqual(a: string, b: string) {
  return timingSafeEqual(digest(a), digest(b));
}

export const BASIC_AUTH_CHALLENGE = 'Basic realm="triply-api", charset="UTF-8"';

export function validateBasicAuth(request: Request): boolean {
  const username = process.env.NEXT_PUBLIC_AUTH_USERNAME;
  const password = process.env.NEXT_PUBLIC_AUTH_PASSWORD;
  if (!username || !password) return false;

  const match = /^Basic\s+(.+)$/i.exec(request.headers.get("authorization") ?? "");
  if (!match) return false;

  const decoded = Buffer.from(match[1], "base64").toString("utf8");
  const separator = decoded.indexOf(":");
  if (separator < 0) return false;

  const usernameOk = safeEqual(decoded.slice(0, separator), username);
  const passwordOk = safeEqual(decoded.slice(separator + 1), password);
  return usernameOk && passwordOk;
}