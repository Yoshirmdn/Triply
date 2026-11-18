import { describe, expect, it } from "vitest";
import {
  normalizeRecord,
  parseScrapeText,
  safeMapsUrl,
} from "@/lib/gmaps-import";
import { matchStat, type StatRecord } from "@/lib/stat-match";

const row = {
  title: "Warung Nasi Bu Sri",
  latitude: -6.9175,
  longtitude: 107.6191,
  review_rating: 4.6,
  review_count: 1280,
  price_range: "Rp 25–50 rb",
  link: "https://www.google.com/maps/place/Warung+Nasi+Bu+Sri",
  cid: "123456789",
};

describe("gmaps import", () => {
  it("normalizes a record including the misspelled longitude key", () => {
    const place = normalizeRecord(row);
    expect(place).toMatchObject({
      externalId: "123456789",
      name: "Warung Nasi Bu Sri",
      latitude: -6.9175,
      longitude: 107.6191,
      rating: 4.6,
      reviewCount: 1280,
      priceRange: "Rp 25–50 rb",
    });
    expect(place?.mapsUrl).toContain("google.com/maps");
  });

  it("accepts a correctly spelled longitude key", () => {
    expect(
      normalizeRecord({ ...row, longtitude: undefined, longitude: 107.6 })
        ?.longitude,
    ).toBe(107.6);
  });

  it("rejects records without a name or valid coordinates", () => {
    expect(normalizeRecord({ ...row, title: "" })).toBeNull();
    expect(normalizeRecord({ ...row, latitude: 120 })).toBeNull();
    expect(normalizeRecord({ title: "X" })).toBeNull();
    expect(normalizeRecord(null)).toBeNull();
  });

  it("drops out-of-range ratings and unsafe links", () => {
    expect(normalizeRecord({ ...row, review_rating: 9 })?.rating).toBeNull();
    expect(
      normalizeRecord({ ...row, link: "javascript:alert(1)" })?.mapsUrl,
    ).toBeNull();
    expect(safeMapsUrl("http://www.google.com/maps/x")).toBeNull();
    expect(safeMapsUrl("https://evil.example/maps")).toBeNull();
  });

  it("falls back to a name and coordinate id when there is no cid", () => {
    const place = normalizeRecord({ ...row, cid: undefined });
    expect(place?.externalId).toBe("warung nasi bu sri|-6.91750|107.61910");
  });

  it("parses json lines and skips broken lines", () => {
    const text = [
      JSON.stringify(row),
      "{rusak",
      "",
      JSON.stringify({ ...row, cid: "2", title: "Kafe Dago" }),
    ].join("\n");
    const result = parseScrapeText(text);
    expect(result.places).toHaveLength(2);
    expect(result.skipped).toBe(1);
  });

  it("parses a json array and dedupes by id", () => {
    const result = parseScrapeText(
      JSON.stringify([row, { ...row, review_count: 5 }]),
    );
    expect(result.places).toHaveLength(1);
    expect(result.places[0].reviewCount).toBe(5);
  });
});

const stat = (overrides: Partial<StatRecord>): StatRecord => ({
  name: "Warung Nasi Bu Sri",
  latitude: -6.9175,
  longitude: 107.6191,
  rating: 4.6,
  reviewCount: 10,
  priceRange: null,
  mapsUrl: null,
  ...overrides,
});

describe("stat matching", () => {
  it("matches the nearest place with a similar name", () => {
    const near = stat({ latitude: -6.91755 });
    const far = stat({ latitude: -6.9185, rating: 3 });
    expect(
      matchStat(
        { name: "Nasi Bu Sri", latitude: -6.9175, longitude: 107.6191 },
        [far, near],
      ),
    ).toBe(near);
  });

  it("does not match when too far or the name differs", () => {
    const target = {
      name: "Warung Nasi Bu Sri",
      latitude: -6.9175,
      longitude: 107.6191,
    };
    expect(matchStat(target, [stat({ latitude: -6.93 })])).toBeNull();
    expect(matchStat(target, [stat({ name: "Bakso Pak Joko" })])).toBeNull();
  });
});
