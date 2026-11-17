const STOP_WORDS = new Set([
  "the", "of", "and", "dan", "di", "ke", "dari", "kota", "kab", "kabupaten", "jalan", "jl", "no",
  "restoran", "restaurant", "cafe", "kafe", "warung", "toko", "rumah", "makan",
]);

export function tokenize(value: string): string[] {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

export function titleMatches(name: string, title: string): boolean {
  const nameTokens = new Set(tokenize(name));
  const titleTokens = tokenize(title);
  if (nameTokens.size === 0 || titleTokens.length === 0) return false;
  const shared = titleTokens.filter((token) => nameTokens.has(token)).length;
  return shared >= 1 && shared / titleTokens.length >= 0.5;
}

export function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

export function firstSegment(value: string): string {
  return value.split(",")[0]?.trim() ?? value.trim();
}