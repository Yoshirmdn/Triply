import { describe, expect, it } from "vitest";
import { formatDistance, formatDuration, formatIDR } from "@/utils/format";

describe("format utils", () => {
  it("formats rupiah without decimals", () => {
    expect(formatIDR(1500000)).toMatch(/1\.500\.000/);
    expect(formatIDR("0")).toMatch(/0/);
  });

  it("formats distance in meters and kilometers", () => {
    expect(formatDistance(450)).toBe("450 m");
    expect(formatDistance(12500)).toMatch(/12,5 km/);
  });

  it("formats duration", () => {
    expect(formatDuration(20)).toBe("< 1 mnt");
    expect(formatDuration(25 * 60)).toBe("25 mnt");
    expect(formatDuration(3600)).toBe("1 j");
    expect(formatDuration(5400)).toBe("1 j 30 mnt");
  });
});
