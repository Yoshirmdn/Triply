import { describe, expect, it } from "vitest";
import {
  generateShareToken,
  isValidShareToken,
  sharePath,
} from "@/lib/share-token";

describe("share helpers", () => {
  it("generates unique url-safe tokens that validate", () => {
    const a = generateShareToken();
    const b = generateShareToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(isValidShareToken(a)).toBe(true);
  });

  it("rejects malformed tokens", () => {
    expect(isValidShareToken("short")).toBe(false);
    expect(isValidShareToken("has spaces and ../ chars!!!!!!!!")).toBe(false);
    expect(isValidShareToken("")).toBe(false);
  });

  it("builds the public path", () => {
    expect(sharePath("abc")).toBe("/share/abc");
  });
});
