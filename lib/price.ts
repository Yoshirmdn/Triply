export type PriceRange = { min: number; max: number };

const DOLLAR_LEVELS: Record<number, PriceRange> = {
  1: { min: 10_000, max: 40_000 },
  2: { min: 40_000, max: 100_000 },
  3: { min: 100_000, max: 250_000 },
  4: { min: 250_000, max: 600_000 },
};

function suffixMultiplier(suffix: string | undefined): number {
  if (!suffix) return 1;
  const value = suffix.toLowerCase();
  if (value === "rb" || value === "ribu" || value === "k") return 1000;
  if (value === "jt" || value === "juta" || value === "m") return 1_000_000;
  return 1;
}

function toNumber(raw: string): number | null {
  let text = raw.trim();
  if (/^\d{1,3}([.,]\d{3})+$/.test(text)) text = text.replace(/[.,]/g, "");
  else text = text.replace(",", ".");
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

export function parsePriceRange(
  text: string | null | undefined,
): PriceRange | null {
  if (!text) return null;
  const clean = text.trim();
  if (clean === "") return null;

  const dollars = /^[$€£]{1,4}$/.exec(clean);
  if (dollars) return DOLLAR_LEVELS[clean.length] ?? null;

  const tokens: { value: number; suffix: string | undefined }[] = [];
  const pattern = /(\d[\d.,]*)\s*(rb|ribu|k|jt|juta|m)?\b/gi;
  let match = pattern.exec(clean);
  while (match) {
    const value = toNumber(match[1]);
    if (value !== null) tokens.push({ value, suffix: match[2] });
    match = pattern.exec(clean);
  }
  if (tokens.length === 0) return null;

  const fallback = tokens[tokens.length - 1].suffix;
  const values = tokens.map(
    (token) =>
      token.value *
      suffixMultiplier(
        token.suffix ?? (token.value < 1000 ? fallback : undefined),
      ),
  );
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min <= 0 || max > 50_000_000) return null;
  return { min, max };
}

export function midpoint(range: PriceRange): number {
  return Math.round((range.min + range.max) / 2);
}

type CostItem = { priceRange: string | null; category: string };

export function estimateDayCost(
  items: CostItem[],
  travelers: number,
): { total: number; priced: number; unpriced: number } {
  let total = 0;
  let priced = 0;
  let unpriced = 0;

  for (const item of items) {
    if (item.category === "HOTEL") continue;
    const range = parsePriceRange(item.priceRange);
    if (!range) {
      unpriced += 1;
      continue;
    }
    total += midpoint(range) * Math.max(1, travelers);
    priced += 1;
  }

  return { total, priced, unpriced };
}
