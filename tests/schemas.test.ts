import { describe, expect, it } from "vitest";
import {
  tripInputSchema,
  validateTripDates,
} from "@/lib/validations/trip.schema";
import { expenseInputSchema } from "@/lib/validations/expense.schema";

const validTrip = {
  title: "Liburan Bali",
  destination: "Bali",
  startDate: "2026-12-24",
  endDate: "2026-12-28",
  travelers: 2,
  budget: 5000000,
  status: "PLANNING",
};

describe("trip schema", () => {
  it("accepts a valid trip", () => {
    expect(tripInputSchema.safeParse(validTrip).success).toBe(true);
  });

  it("rejects an end date before the start date", () => {
    const result = tripInputSchema.safeParse({
      ...validTrip,
      endDate: "2026-12-20",
    });
    expect(result.success).toBe(false);
    expect(validateTripDates("2026-12-24", "2026-12-20")).not.toBeNull();
  });

  it("rejects an empty title and zero travelers", () => {
    expect(
      tripInputSchema.safeParse({ ...validTrip, title: " " }).success,
    ).toBe(false);
    expect(
      tripInputSchema.safeParse({ ...validTrip, travelers: 0 }).success,
    ).toBe(false);
  });
});

describe("expense schema", () => {
  it("accepts a valid expense", () => {
    const result = expenseInputSchema.safeParse({
      category: "FOOD_DRINKS",
      description: "Makan malam",
      amount: 150000,
      expenseDate: "2026-12-24",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-positive amounts", () => {
    const result = expenseInputSchema.safeParse({
      category: "FOOD_DRINKS",
      description: "Makan malam",
      amount: 0,
      expenseDate: "2026-12-24",
    });
    expect(result.success).toBe(false);
  });
});
