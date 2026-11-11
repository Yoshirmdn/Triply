import "server-only";
import {
  ALL_GEOAPIFY_CATEGORIES,
  PLACE_CATEGORY_GEOAPIFY,
  type PlaceCategoryValue,
} from "@/data/places";
import type {
  PlaceDTO,
  PlaceDetailDTO,
  PlaceSuggestionDTO,
} from "@/@type/place";

const BASE_URL = "https://api.geoapify.com";

export class PlacesApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "PlacesApiError";
    this.status = status;
  }
}

type GeoapifyProps = {
  place_id?: string;
  name?: string;
  formatted?: string;
  address_line1?: string;
  address_line2?: string;
  lat?: number;
  lon?: number;
  categories?: string[];
  website?: string;
  opening_hours?: string;
  contact?: { phone?: string };
  feature_type?: string;
};

function apiKey(): string {
  const key = process.env.GEOAPIFY_API_KEY;
  if (!key)
    throw new PlacesApiError(503, "Geoapify API key is not configured!");
  return key;
}

async function callGeoapify<T>(
  path: string,
  params: Record<string, string | number | undefined>,
): Promise<T> {
  const url = new URL(path, BASE_URL);
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== "")
      url.searchParams.set(name, String(value));
  }
  url.searchParams.set("apiKey", apiKey());

  const res = await fetch(url, { cache: "no-store" });

  if (res.status === 404) throw new PlacesApiError(404, "Place not found!");
  if (res.status === 429)
    throw new PlacesApiError(429, "Places quota exceeded!");
  if (res.status === 401 || res.status === 403)
    throw new PlacesApiError(502, "Geoapify API key is invalid!");
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Geoapify error", res.status, text);
    throw new PlacesApiError(502, "Places request failed!");
  }

  return (await res.json()) as T;
}

export function inferCategory(categories: string[] = []): PlaceCategoryValue {
  const has = (prefix: string) =>
    categories.some(
      (value) => value === prefix || value.startsWith(`${prefix}.`),
    );

  if (has("entertainment.museum")) return "MUSEUM";
  if (has("catering.cafe")) return "CAFE";
  if (has("catering")) return "RESTAURANT";
  if (has("accommodation")) return "HOTEL";
  if (has("commercial")) return "SHOPPING";
  if (has("natural") || has("leisure.park") || has("beach")) return "NATURE";
  if (has("entertainment")) return "ENTERTAINMENT";
  if (has("tourism")) return "ATTRACTION";
  return "OTHER";
}

export async function autocompleteLocations(input: {
  text: string;
  lat?: number;
  lng?: number;
  limit?: number;
}): Promise<PlaceSuggestionDTO[]> {
  const data = await callGeoapify<{ results?: GeoapifyProps[] }>(
    "/v1/geocode/autocomplete",
    {
      text: input.text,
      format: "json",
      limit: input.limit ?? 5,
      lang: "id",
      bias:
        input.lat !== undefined && input.lng !== undefined
          ? `proximity:${input.lng},${input.lat}`
          : undefined,
    },
  );

  const result: PlaceSuggestionDTO[] = [];
  for (const item of data.results ?? []) {
    if (item.lat === undefined || item.lon === undefined) continue;
    result.push({
      key: item.place_id ?? `${item.lat},${item.lon}`,
      primaryText: item.address_line1 ?? item.name ?? item.formatted ?? "",
      secondaryText: item.address_line2 ?? null,
      latitude: item.lat,
      longitude: item.lon,
    });
  }
  return result;
}

export async function geocodeFirst(
  text: string,
): Promise<{ latitude: number; longitude: number } | null> {
  const results = await autocompleteLocations({ text, limit: 1 });
  const first = results[0];
  return first
    ? { latitude: first.latitude, longitude: first.longitude }
    : null;
}

export async function searchPlaces(input: {
  lat: number;
  lng: number;
  radius: number;
  limit: number;
  category?: PlaceCategoryValue;
  name?: string;
}): Promise<PlaceDTO[]> {
  const categories =
    input.category && input.category !== "OTHER"
      ? PLACE_CATEGORY_GEOAPIFY[input.category]
      : ALL_GEOAPIFY_CATEGORIES;

  const data = await callGeoapify<{
    features?: { properties: GeoapifyProps }[];
  }>("/v2/places", {
    categories,
    filter: `circle:${input.lng},${input.lat},${input.radius}`,
    bias: `proximity:${input.lng},${input.lat}`,
    limit: input.limit,
    name: input.name,
    lang: "id",
  });

  const result: PlaceDTO[] = [];
  const seen = new Set<string>();
  for (const feature of data.features ?? []) {
    const props = feature.properties;
    if (
      !props.place_id ||
      !props.name ||
      props.lat === undefined ||
      props.lon === undefined
    )
      continue;
    if (seen.has(props.place_id)) continue;
    seen.add(props.place_id);
    result.push({
      placeId: props.place_id,
      name: props.name,
      address: props.formatted ?? props.address_line2 ?? null,
      latitude: props.lat,
      longitude: props.lon,
      category: inferCategory(props.categories),
    });
  }
  return result;
}

export async function getPlaceDetail(placeId: string): Promise<PlaceDetailDTO> {
  const data = await callGeoapify<{
    features?: { properties: GeoapifyProps }[];
  }>("/v2/place-details", {
    id: placeId,
    features: "details",
    lang: "id",
  });

  const props =
    data.features?.find(
      (feature) => feature.properties.feature_type === "details",
    )?.properties ?? data.features?.[0]?.properties;
  if (!props || props.lat === undefined || props.lon === undefined)
    throw new PlacesApiError(404, "Place not found!");

  return {
    placeId,
    name: props.name ?? props.formatted ?? "Tanpa nama",
    address: props.formatted ?? null,
    latitude: props.lat,
    longitude: props.lon,
    category: inferCategory(props.categories),
    websiteUri: props.website ?? null,
    phone: props.contact?.phone ?? null,
    openingHours: props.opening_hours ?? null,
  };
}
