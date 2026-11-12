export const ROUTE_MODES = ["drive", "motorcycle", "bicycle", "walk"] as const;
export type RouteMode = (typeof ROUTE_MODES)[number];

export const ROUTE_MODE_LABELS: Record<RouteMode, string> = {
  drive: "Mobil",
  motorcycle: "Motor",
  bicycle: "Sepeda",
  walk: "Jalan kaki",
};

export const MAX_ROUTE_STOPS = 25;