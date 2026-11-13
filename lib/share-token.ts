import { randomBytes } from "node:crypto";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,64}$/;

export function generateShareToken(): string {
  return randomBytes(24).toString("base64url");
}

export function isValidShareToken(token: string): boolean {
  return TOKEN_PATTERN.test(token);
}

export function sharePath(token: string): string {
  return `/share/${token}`;
}
