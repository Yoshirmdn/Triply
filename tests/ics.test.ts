import { describe, expect, it } from "vitest";
import {
  buildIcs,
  escapeIcsText,
  foldIcsLine,
  slugify,
  type IcsItem,
} from "@/lib/ics";

const base: IcsItem = {
  id: "11111111-1111-1111-1111-111111111111",
  title: "Pantai Kuta",
  date: "2026-12-24",
  startTime: "09:00",
  endTime: "11:30",
  address: "Kuta, Badung, Bali",
  latitude: -8.72,
  longitude: 115.17,
  notes: "Bawa sunscreen; payung",
  dayNumber: 1,
};

const now = new Date("2026-11-17T06:00:00Z");

describe("ics", () => {
  it("escapes special characters", () => {
    expect(escapeIcsText("a, b; c\\d\nline")).toBe("a\\, b\\; c\\\\d\\nline");
  });

  it("folds long lines at 75 octets with a leading space", () => {
    const folded = foldIcsLine(`SUMMARY:${"a".repeat(200)}`);
    for (const part of folded.split("\r\n")) {
      expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75);
    }
    expect(folded.replaceAll("\r\n ", "")).toBe(`SUMMARY:${"a".repeat(200)}`);
  });

  it("builds a timed event with floating local time", () => {
    const ics = buildIcs({ tripTitle: "Liburan Bali", items: [base], now });
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("DTSTART:20261224T090000");
    expect(ics).toContain("DTEND:20261224T113000");
    expect(ics).toContain("DTSTAMP:20261117T060000Z");
    expect(ics).toContain("UID:11111111-1111-1111-1111-111111111111@triply");
    expect(ics).toContain("SUMMARY:Pantai Kuta");
    expect(ics).toContain("LOCATION:Kuta\\, Badung\\, Bali");
    expect(ics).toContain("GEO:-8.72;115.17");
    expect(ics).toContain("Bawa sunscreen\\; payung");
  });

  it("defaults to one hour when the end time is missing or invalid", () => {
    const ics = buildIcs({
      tripTitle: "T",
      items: [
        { ...base, endTime: null },
        { ...base, id: "b", endTime: "08:00" },
      ],
      now,
    });
    expect(ics.match(/DTEND:20261224T100000/g)?.length).toBe(2);
  });

  it("uses an all-day event when there is no start time", () => {
    const ics = buildIcs({
      tripTitle: "T",
      items: [{ ...base, startTime: null, endTime: null }],
      now,
    });
    expect(ics).toContain("DTSTART;VALUE=DATE:20261224");
    expect(ics).toContain("DTEND;VALUE=DATE:20261225");
  });

  it("rolls the all-day end over month boundaries", () => {
    const ics = buildIcs({
      tripTitle: "T",
      items: [{ ...base, date: "2026-12-31", startTime: null, endTime: null }],
      now,
    });
    expect(ics).toContain("DTEND;VALUE=DATE:20270101");
  });

  it("slugifies titles for filenames", () => {
    expect(slugify("Liburan ke Bali — Desember 2026!")).toBe(
      "liburan-ke-bali-desember-2026",
    );
    expect(slugify("!!!")).toBe("itinerary");
  });
});
