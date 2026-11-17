import { describe, expect, it } from "vitest";
import {
  bookingHotelsUrl,
  busSearchUrl,
  googleFlightsUrl,
  webSearchUrl,
} from "@/lib/travel-links";

describe("travel links", () => {
  it("builds a google flights url from the first segment of each place", () => {
    const url = new URL(
      googleFlightsUrl({
        origin: "Jakarta, DKI Jakarta",
        destination: "Bali, Indonesia",
        startDate: "2026-12-24",
        endDate: "2026-12-28",
      }),
    );
    expect(url.hostname).toBe("www.google.com");
    expect(url.searchParams.get("q")).toBe(
      "Flights from Jakarta to Bali on 2026-12-24 through 2026-12-28",
    );
  });

  it("builds a booking.com url with dates and guests", () => {
    const url = new URL(
      bookingHotelsUrl({
        destination: "Bandung, Jawa Barat",
        startDate: "2026-12-24",
        endDate: "2026-12-26",
        travelers: 3,
      }),
    );
    expect(url.hostname).toBe("www.booking.com");
    expect(url.searchParams.get("ss")).toBe("Bandung");
    expect(url.searchParams.get("checkin")).toBe("2026-12-24");
    expect(url.searchParams.get("checkout")).toBe("2026-12-26");
    expect(url.searchParams.get("group_adults")).toBe("3");
  });

  it("clamps guests to a sane range", () => {
    const url = new URL(
      bookingHotelsUrl({
        destination: "Bali",
        startDate: "2026-12-24",
        endDate: "2026-12-26",
        travelers: 0,
      }),
    );
    expect(url.searchParams.get("group_adults")).toBe("1");
  });

  it("encodes search queries", () => {
    expect(webSearchUrl("tiket bus a&b")).toContain("tiket%20bus%20a%26b");
    expect(busSearchUrl("Bandung, Jawa Barat", "Yogyakarta")).toContain(
      "Bandung%20ke%20Yogyakarta",
    );
  });
});
