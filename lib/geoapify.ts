import "server-only";
import type { RouteDTO } from "@/@type/itinerary";
import type { RouteMode } from "@/data/itinerary";

const BASE_URL = "https://api.geoapify.com";

export class PlacesApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "PlacesApiError";
    this.status = status;
  }
}

function apiKey(): string {
  const key = process.env.GEOAPIFY_API_KEY;
  if (!key) throw new PlacesApiError(503, "Geoapify API key is not configured!");
  return key;
}

async function callGeoapify<T>(path: string, params: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(path, BASE_URL);
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(name, String(value));
  }
  url.searchParams.set("apiKey", apiKey());

  const res = await fetch(url, { cache: "no-store" });

  if (res.status === 404) throw new PlacesApiError(404, "Place not found!");
  if (res.status === 429) throw new PlacesApiError(429, "Places quota exceeded!");
  if (res.status === 400) {
    const text = await res.text().catch(() => "");
    console.error("Geoapify rejected request", text);
    throw new PlacesApiError(422, "Provider rejected the request!");
  }
  if (res.status === 401 || res.status === 403) throw new PlacesApiError(502, "Geoapify API key is invalid!");
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Geoapify error", res.status, text);
    throw new PlacesApiError(502, "Places request failed!");
  }

  return (await res.json()) as T;
}

export async function getRoute(points: { latitude: number; longitude: number }[], mode: RouteMode): Promise<RouteDTO> {
  const data = await callGeoapify<{
    features?: {
      properties: { distance?: number; time?: number; legs?: { distance?: number; time?: number }[] };
      geometry: { type: string; coordinates: unknown };
    }[];
  }>("/v1/routing", {
    waypoints: points.map((point) => `${point.latitude},${point.longitude}`).join("|"),
    mode,
    type: "balanced",
    units: "metric",
  });

  const feature = data.features?.[0];
  if (!feature) throw new PlacesApiError(422, "Provider rejected the request!");

  const coordinates = feature.geometry.coordinates as number[][][] | number[][];
  const lines: number[][][] =
    feature.geometry.type === "MultiLineString" ? (coordinates as number[][][]) : [coordinates as number[][]];

  return {
    distance: feature.properties.distance ?? 0,
    time: feature.properties.time ?? 0,
    legs: (feature.properties.legs ?? []).map((leg) => ({ distance: leg.distance ?? 0, time: leg.time ?? 0 })),
    line: lines.map((line) => line.map((point) => [point[1], point[0]] as [number, number])),
  };
}