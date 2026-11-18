import type { PlaceCategoryValue } from "@/data/places";

export type OpenHours = Record<string, string[]>;

export type ScrapedPlace = {
  externalId: string;
  name: string;
  category: PlaceCategoryValue;
  categories: string[];
  address: string | null;
  city: string | null;
  province: string | null;
  latitude: number;
  longitude: number;
  rating: number | null;
  reviewCount: number | null;
  priceRange: string | null;
  mapsUrl: string | null;
  photoUrl: string | null;
  website: string | null;
  phone: string | null;
  description: string | null;
  openHours: OpenHours | null;
};

export type ParseResult = {
  places: ScrapedPlace[];
  skipped: number;
};

const PHOTO_HOST_SUFFIXES = ["googleusercontent.com", "ggpht.com"];
const MAPS_HOSTS = new Set(["www.google.com", "google.com", "maps.google.com", "maps.app.goo.gl", "goo.gl"]);

const BOUNDS = { minLat: -11.5, maxLat: 6.5, minLng: 94, maxLng: 141.5 };

const CATEGORY_RULES: { category: PlaceCategoryValue; keywords: string[] }[] = [
  {
    category: "OTHER",
    keywords: ["gas station", "atm", "bank", "hospital", "clinic", "school", "pharmacy", "convenience store", "police", "parking", "car wash", "laundry"],
  },
  { category: "MUSEUM", keywords: ["museum", "art gallery", "planetarium"] },
  { category: "HOTEL", keywords: ["hotel", "resort", "hostel", "guest house", "guesthouse", "homestay", "villa", "lodging", "inn", "bed & breakfast", "cottage", "motel", "bungalow", "glamping"] },
  { category: "CAFE", keywords: ["cafe", "café", "coffee", "tea house", "bakery", "dessert", "ice cream", "juice"] },
  {
    category: "RESTAURANT",
    keywords: ["restaurant", "warung", "food court", "eatery", "diner", "bistro", "grill", "noodle", "soto", "bakso", "sate", "seafood", "pizza", "burger", "steak", "ramen", "padang", "fast food", "chicken", "barbecue", "buffet"],
  },
  { category: "SHOPPING", keywords: ["shopping", "mall", "market", "souvenir", "gift", "outlet", "supermarket", "department store", "store", "shop", "boutique"] },
  {
    category: "ENTERTAINMENT",
    keywords: ["amusement", "theme park", "water park", "waterpark", "zoo", "aquarium", "cinema", "movie theater", "karaoke", "bowling", "arcade", "night club", "nightclub", "entertainment", "safari", "playground", "recreation", "spa", "billiard", "family fun"],
  },
  {
    category: "NATURE",
    keywords: ["beach", "waterfall", "mountain", "national park", "nature", "hiking", "garden", "botanical", "volcano", "crater", "cave", "forest", "island", "hot spring", "lake", "river", "hill", "canyon", "coral", "bay", "rice terrace", "camping", "viewpoint", "park", "reserve", "snorkeling", "diving"],
  },
  {
    category: "ATTRACTION",
    keywords: ["tourist attraction", "temple", "monument", "landmark", "historical", "history", "castle", "palace", "fort", "heritage", "cultural", "mosque", "church", "pura", "candi", "sightseeing", "observation", "tower", "bridge", "village", "square"],
  },
];

const COMPILED_RULES = CATEGORY_RULES.map((rule) => ({
  category: rule.category,
  pattern: new RegExp(`(^|[^a-z])(${rule.keywords.map((keyword) => keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "i"),
}));

export function mapCategory(categories: string[]): PlaceCategoryValue {
  for (const rule of COMPILED_RULES) {
    if (categories.some((value) => rule.pattern.test(value))) return rule.category;
  }
  return "OTHER";
}

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
    const allowed = PHOTO_HOST_SUFFIXES.some((suffix) => url.hostname === suffix || url.hostname.endsWith(`.${suffix}`));
    return allowed ? url.toString() : null;
  } catch {
    return null;
  }
}

export function safeWebsite(value: unknown): string | null {
  const text = asText(value, 500);
  if (!text) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function firstImage(value: unknown): unknown {
  if (!Array.isArray(value) || value.length === 0) return null;
  const first: unknown = value[0];
  if (typeof first === "string") return first;
  if (typeof first === "object" && first !== null) return (first as Record<string, unknown>).image;
  return null;
}

function normalizeHours(value: unknown): OpenHours | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const result: OpenHours = {};
  for (const [day, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!Array.isArray(raw)) continue;
    const slots = raw.filter((slot): slot is string => typeof slot === "string" && slot.trim() !== "").map((slot) => slot.trim().slice(0, 60));
    if (slots.length > 0) result[day.slice(0, 20)] = slots.slice(0, 4);
  }
  return Object.keys(result).length > 0 ? result : null;
}

function readCategories(row: Record<string, unknown>): string[] {
  const list: string[] = [];
  if (Array.isArray(row.categories)) {
    for (const value of row.categories) {
      const text = asText(value, 80);
      if (text) list.push(text);
    }
  }
  const single = asText(row.category, 80);
  if (single && !list.includes(single)) list.unshift(single);
  return list.slice(0, 10);
}

function hashText(text: string): string {
  let hash = 5381;
  for (let index = 0; index < text.length; index += 1) hash = ((hash * 33) ^ text.charCodeAt(index)) >>> 0;
  return hash.toString(36);
}

function readAddress(row: Record<string, unknown>): { city: string | null; province: string | null } {
  const complete = row.complete_address;
  if (typeof complete !== "object" || complete === null) return { city: null, province: null };
  const record = complete as Record<string, unknown>;
  return { city: asText(record.city, 100), province: asText(record.state, 100) };
}

export function normalizeRecord(record: unknown): ScrapedPlace | null {
  if (typeof record !== "object" || record === null) return null;
  const row = record as Record<string, unknown>;

  const name = asText(row.title ?? row.name, 200);
  const latitude = asNumber(row.latitude ?? row.lat);
  const longitude = asNumber(row.longitude ?? row.longtitude ?? row.lng);
  if (!name || latitude === null || longitude === null) return null;
  if (latitude < BOUNDS.minLat || latitude > BOUNDS.maxLat || longitude < BOUNDS.minLng || longitude > BOUNDS.maxLng) return null;

  const status = asText(row.status, 60)?.toLowerCase() ?? "";
  if (status.includes("permanently") || status === "closed") return null;

  const rawRating = asNumber(row.review_rating ?? row.rating);
  const rating = rawRating !== null && rawRating >= 0 && rawRating <= 5 ? Math.round(rawRating * 10) / 10 : null;

  const rawCount = asNumber(row.review_count ?? row.reviews);
  const reviewCount = rawCount !== null && rawCount >= 0 ? Math.round(rawCount) : null;

  const placeId = asText(row.place_id, 200);
  const cid = asText(row.cid, 80);
  const safeId = (value: string | null) => (value && /^[A-Za-z0-9_-]{5,300}$/.test(value) ? value : null);
  const externalId =
    safeId(placeId) ?? safeId(cid) ?? `x${hashText(`${name.toLowerCase()}|${latitude.toFixed(5)}|${longitude.toFixed(5)}`)}`;

  const categories = readCategories(row);
  const { city, province } = readAddress(row);

  return {
    externalId,
    name,
    category: mapCategory(categories),
    categories,
    address: asText(row.address, 500),
    city,
    province,
    latitude,
    longitude,
    rating: rating === 0 && reviewCount === 0 ? null : rating,
    reviewCount,
    priceRange: asText(row.price_range, 20),
    mapsUrl: safeMapsUrl(row.link),
    photoUrl: safePhotoUrl(row.thumbnail) ?? safePhotoUrl(firstImage(row.images)),
    website: safeWebsite(row.web_site),
    phone: asText(row.phone, 40),
    description: asText(row.description, 600),
    openHours: normalizeHours(row.open_hours),
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