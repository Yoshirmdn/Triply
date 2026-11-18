import { describe, expect, it } from "vitest";
import { TRIP_TEMPLATES, getTemplate } from "@/data/templates";
import { MAX_GENERATE_DAYS, TRIP_PACES, TRIP_STYLES } from "@/data/generator";
import {
  applyPlanSchema,
  generateRequestSchema,
  useTemplateSchema,
} from "@/lib/validations/generator.schema";

describe("trip templates", () => {
  it("has unique ids and valid settings", () => {
    const ids = TRIP_TEMPLATES.map((template) => template.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const template of TRIP_TEMPLATES) {
      expect(template.days).toBeGreaterThanOrEqual(1);
      expect(template.days).toBeLessThanOrEqual(MAX_GENERATE_DAYS);
      expect(TRIP_STYLES).toContain(template.style);
      expect(TRIP_PACES).toContain(template.pace);
      expect(template.radius).toBeGreaterThanOrEqual(1000);
      expect(template.radius).toBeLessThanOrEqual(50000);
      expect(Math.abs(template.latitude)).toBeLessThanOrEqual(11);
      expect(template.longitude).toBeGreaterThan(94);
      expect(template.longitude).toBeLessThan(142);
    }
  });

  it("finds a template by id", () => {
    expect(getTemplate("bali-santai-4")?.destination).toBe("Bali");
    expect(getTemplate("tidak-ada")).toBeUndefined();
  });
});

describe("generator schemas", () => {
  it("applies defaults to a generate request", () => {
    expect(generateRequestSchema.parse({})).toEqual({
      style: "BALANCED",
      pace: "NORMAL",
      radius: 15000,
    });
    expect(generateRequestSchema.safeParse({ style: "LUXURY" }).success).toBe(
      false,
    );
  });

  it("validates a template request", () => {
    expect(
      useTemplateSchema.parse({ templateId: "x", startDate: "2026-12-24" })
        .travelers,
    ).toBe(1);
    expect(
      useTemplateSchema.safeParse({ templateId: "x", startDate: "besok" })
        .success,
    ).toBe(false);
  });

  it("rejects an apply plan with end before start", () => {
    const place = {
      placeId: "abcde12345",
      name: "Tempat",
      latitude: -7.8,
      longitude: 110.3,
      category: "ATTRACTION",
    };
    const good = {
      days: [
        {
          dayNumber: 1,
          items: [{ place, startTime: "09:00", endTime: "10:00" }],
        },
      ],
    };
    const bad = {
      days: [
        {
          dayNumber: 1,
          items: [{ place, startTime: "10:00", endTime: "09:00" }],
        },
      ],
    };
    expect(applyPlanSchema.safeParse(good).success).toBe(true);
    expect(applyPlanSchema.safeParse(bad).success).toBe(false);
  });
});
