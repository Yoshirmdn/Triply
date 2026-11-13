import { describe, expect, it } from "vitest";
import {
  buildDateRange,
  countDays,
  formatDateID,
  parseDateInput,
  toDateInput,
} from "@/utils/date";

describe("date utils", () => {
  it("round-trips a date input", () => {
    expect(toDateInput(parseDateInput("2026-12-24"))).toBe("2026-12-24");
  });

  it("counts days inclusively", () => {
    expect(
      countDays(parseDateInput("2026-12-24"), parseDateInput("2026-12-24")),
    ).toBe(1);
    expect(
      countDays(parseDateInput("2026-12-24"), parseDateInput("2026-12-28")),
    ).toBe(5);
  });

  it("builds a date range and returns empty for reversed input", () => {
    const range = buildDateRange(
      parseDateInput("2026-02-27"),
      parseDateInput("2026-03-02"),
    );
    expect(range.map(toDateInput)).toEqual([
      "2026-02-27",
      "2026-02-28",
      "2026-03-01",
      "2026-03-02",
    ]);
    expect(
      buildDateRange(
        parseDateInput("2026-03-02"),
        parseDateInput("2026-02-27"),
      ),
    ).toEqual([]);
  });

  it("formats in Indonesian", () => {
    expect(formatDateID("2026-08-17")).toContain("2026");
  });
});
