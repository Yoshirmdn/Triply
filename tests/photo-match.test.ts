import { describe, expect, it } from "vitest";
import { distanceMeters, firstSegment, titleMatches, tokenize } from "@/lib/photo-match";

describe("photo match", () => {
  it("tokenizes without accents, stop words, and short tokens", () => {
    expect(tokenize("Restoran Sate Ayam di Kota Bandung")).toEqual(["sate", "ayam", "bandung"]);
    expect(tokenize("Café Lumière")).toEqual(["lumiere"]);
  });

  it("matches a place name against a wikipedia title", () => {
    expect(titleMatches("Tanah Lot Temple", "Pura Tanah Lot")).toBe(true);
    expect(titleMatches("Borobudur", "Candi Borobudur")).toBe(true);
  });

  it("rejects unrelated titles", () => {
    expect(titleMatches("Warung Bu Ani", "Indonesia")).toBe(false);
    expect(titleMatches("Hotel Indonesia Kempinski", "Sejarah Kerajaan Majapahit Nusantara")).toBe(false);
  });

  it("computes distance in meters", () => {
    expect(Math.round(distanceMeters(-6.2, 106.8, -6.2, 106.8))).toBe(0);
    const km = distanceMeters(-6.2, 106.8, -6.9, 107.6) / 1000;
    expect(km).toBeGreaterThan(100);
    expect(km).toBeLessThan(140);
  });

  it("takes the first segment of a destination label", () => {
    expect(firstSegment("Bandung, Jawa Barat, Indonesia")).toBe("Bandung");
    expect(firstSegment("Bali")).toBe("Bali");
  });
});