import "server-only";
import { distanceMeters, firstSegment, titleMatches } from "@/lib/photo-match";
import type { PlacePhotoDTO } from "@/@type/place";

const LANGUAGES = ["id", "en"] as const;
const HIT_TTL = 7 * 24 * 60 * 60 * 1000;
const MISS_TTL = 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 1000;
const MAX_NAME_DISTANCE = 3000;
const GEO_RADIUS = 600;

type WikiPage = {
  index?: number;
  title: string;
  fullurl?: string;
  thumbnail?: { source: string };
  coordinates?: { lat: number; lon: number }[];
};

type CacheEntry = { value: PlacePhotoDTO | null; expires: number };

const cache = new Map<string, CacheEntry>();

function remember(key: string, value: PlacePhotoDTO | null) {
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { value, expires: Date.now() + (value ? HIT_TTL : MISS_TTL) });
}

async function queryWikipedia(lang: string, params: Record<string, string>): Promise<WikiPage[]> {
  const url = new URL(`https://${lang}.wikipedia.org/w/api.php`);
  const search = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    prop: "pageimages|coordinates|info",
    piprop: "thumbnail",
    pithumbsize: "640",
    inprop: "url",
    redirects: "1",
    ...params,
  });
  url.search = search.toString();

  const res = await fetch(url, {
    headers: { "User-Agent": "Triply/1.0 (travel planner; place photos)", Accept: "application/json" },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { query?: { pages?: WikiPage[] } };
  return [...(json.query?.pages ?? [])].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
}

function toPhoto(page: WikiPage): PlacePhotoDTO | null {
  if (!page.thumbnail?.source || !page.fullurl) return null;
  return { url: page.thumbnail.source, title: page.title, pageUrl: page.fullurl };
}

async function findForPlace(name: string, lat: number | undefined, lng: number | undefined): Promise<PlacePhotoDTO | null> {
  const hasCoords = lat !== undefined && lng !== undefined;

  for (const lang of LANGUAGES) {
    if (hasCoords) {
      const nearby = await queryWikipedia(lang, {
        generator: "geosearch",
        ggscoord: `${lat}|${lng}`,
        ggsradius: String(GEO_RADIUS),
        ggslimit: "10",
        ggsnamespace: "0",
      });
      const match = nearby.find((page) => page.thumbnail && titleMatches(name, page.title));
      const photo = match ? toPhoto(match) : null;
      if (photo) return photo;
    }

    const found = await queryWikipedia(lang, {
      generator: "search",
      gsrsearch: name,
      gsrlimit: "6",
      gsrnamespace: "0",
    });
    const match = found.find((page) => {
      if (!page.thumbnail || !titleMatches(name, page.title)) return false;
      if (!hasCoords) return true;
      const point = page.coordinates?.[0];
      if (!point) return false;
      return distanceMeters(lat, lng, point.lat, point.lon) <= MAX_NAME_DISTANCE;
    });
    const photo = match ? toPhoto(match) : null;
    if (photo) return photo;
  }

  return null;
}

async function findForDestination(name: string): Promise<PlacePhotoDTO | null> {
  const query = firstSegment(name);
  for (const lang of LANGUAGES) {
    const found = await queryWikipedia(lang, {
      generator: "search",
      gsrsearch: query,
      gsrlimit: "5",
      gsrnamespace: "0",
    });
    const match = found.find((page) => page.thumbnail && titleMatches(query, page.title));
    const photo = match ? toPhoto(match) : null;
    if (photo) return photo;
  }
  return null;
}

export async function findPlacePhoto(input: {
  name: string;
  lat?: number;
  lng?: number;
  kind: "place" | "destination";
}): Promise<PlacePhotoDTO | null> {
  const key = [input.kind, input.name.toLowerCase(), input.lat?.toFixed(3) ?? "", input.lng?.toFixed(3) ?? ""].join("|");
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;

  try {
    const value =
      input.kind === "destination" ? await findForDestination(input.name) : await findForPlace(input.name, input.lat, input.lng);
    remember(key, value);
    return value;
  } catch {
    return null;
  }
}