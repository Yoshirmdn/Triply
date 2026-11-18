export type ScrapedPlace = {
  externalId: string;
  name: string;
  latitude: number;
  longitude: number;
  rating: number | null;
  reviewCount: number | null;
  priceRange: string | null;
  mapsUrl: string | null;
  photoUrl: string | null;
};

export type ParseResult = {
  places: ScrapedPlace[];
  skipped: number;
};

const PHOTO_HOST_SUFFIXES = ["googleusercontent.com", "ggpht.com"];
const MAPS_HOSTS = new Set([
  "www.google.com",
  "google.com",
  "maps.google.com",
  "maps.app.goo.gl",
  "goo.gl",
]);

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed.slice(0, max);
}

export function safeMapsUrl(value: unknown): string | null {
  const text = asText(value, 1000);
  if (!text) return null;
  try {
    const url = new URL(text);
    if (url.protocol !== "https:" || !MAPS_HOSTS.has(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function safePhotoUrl(value: unknown): string | null {
  const text = asText(value, 2000);
  if (!text) return null;
  try {
    const url = new URL(text);
    if (url.protocol !== "https:") return null;
    const allowed = PHOTO_HOST_SUFFIXES.some(
      (suffix) =>
        url.hostname === suffix || url.hostname.endsWith(`.${suffix}`),
    );
    return allowed ? url.toString() : null;
  } catch {
    return null;
  }
}

function firstImage(value: unknown): unknown {
  if (!Array.isArray(value) || value.length === 0) return null;
  const first: unknown = value[0];
  if (typeof first === "string") return first;
  if (typeof first === "object" && first !== null)
    return (first as Record<string, unknown>).image;
  return null;
}

export function normalizeRecord(record: unknown): ScrapedPlace | null {
  if (typeof record !== "object" || record === null) return null;
  const row = record as Record<string, unknown>;

  const name = asText(row.title ?? row.name, 200);
  const latitude = asNumber(row.latitude ?? row.lat);
  const longitude = asNumber(row.longitude ?? row.longtitude ?? row.lng);
  if (!name || latitude === null || longitude === null) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)
    return null;

  const rawRating = asNumber(row.review_rating ?? row.rating);
  const rating =
    rawRating !== null && rawRating >= 0 && rawRating <= 5
      ? Math.round(rawRating * 10) / 10
      : null;

  const rawCount = asNumber(row.review_count ?? row.reviews);
  const reviewCount =
    rawCount !== null && rawCount >= 0 ? Math.round(rawCount) : null;

  const cid = asText(row.cid, 80) ?? asText(row.data_id, 120);
  const externalId =
    cid ??
    `${name.toLowerCase()}|${latitude.toFixed(5)}|${longitude.toFixed(5)}`;

  return {
    externalId,
    name,
    latitude,
    longitude,
    rating: rating === 0 && reviewCount === 0 ? null : rating,
    reviewCount,
    priceRange: asText(row.price_range, 20),
    mapsUrl: safeMapsUrl(row.link),
    photoUrl:
      safePhotoUrl(row.thumbnail) ?? safePhotoUrl(firstImage(row.images)),
  };
}

export function parseScrapeText(text: string): ParseResult {
  const trimmed = text.trim();
  const records: unknown[] = [];
  let skipped = 0;

  if (trimmed.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (Array.isArray(parsed)) records.push(...parsed);
    } catch {
      skipped += 1;
    }
  } else {
    for (const line of trimmed.split(/\r?\n/)) {
      if (line.trim() === "") continue;
      try {
        records.push(JSON.parse(line));
      } catch {
        skipped += 1;
      }
    }
  }

  const byId = new Map<string, ScrapedPlace>();
  for (const record of records) {
    const place = normalizeRecord(record);
    if (!place) {
      skipped += 1;
      continue;
    }
    byId.set(place.externalId, place);
  }

  return { places: Array.from(byId.values()), skipped };
}
