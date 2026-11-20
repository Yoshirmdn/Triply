import "server-only";
import { parseDateInput, toDateInput } from "@/utils/date";
import type { DayWeatherDTO } from "@/@type/trip-extra";

const FORECAST_DAYS = 15;
const DAY_MS = 86_400_000;

function numberAt(list: unknown, index: number): number | null {
  if (!Array.isArray(list)) return null;
  const value: unknown = list[index];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function fetchWeather(
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string,
): Promise<Map<string, DayWeatherDTO>> {
  const result = new Map<string, DayWeatherDTO>();

  const today = parseDateInput(new Date().toISOString().slice(0, 10));
  const limit = new Date(today.getTime() + FORECAST_DAYS * DAY_MS);
  const from =
    parseDateInput(startDate) < today ? today : parseDateInput(startDate);
  const to = parseDateInput(endDate) > limit ? limit : parseDateInput(endDate);
  if (from > to) return result;

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", latitude.toFixed(4));
  url.searchParams.set("longitude", longitude.toFixed(4));
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
  );
  url.searchParams.set("timezone", "Asia/Jakarta");
  url.searchParams.set("start_date", toDateInput(from));
  url.searchParams.set("end_date", toDateInput(to));

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 1800 },
    });
    if (!res.ok) return result;
    const json = (await res.json()) as { daily?: Record<string, unknown> };
    const daily = json.daily;
    if (!daily || !Array.isArray(daily.time)) return result;

    daily.time.forEach((date: unknown, index: number) => {
      const code = numberAt(daily.weather_code, index);
      const max = numberAt(daily.temperature_2m_max, index);
      const min = numberAt(daily.temperature_2m_min, index);
      if (
        typeof date !== "string" ||
        code === null ||
        max === null ||
        min === null
      )
        return;
      result.set(date, {
        date,
        code,
        max: Math.round(max),
        min: Math.round(min),
        rainChance: numberAt(daily.precipitation_probability_max, index),
      });
    });
  } catch (error) {
    console.error(error);
  }

  return result;
}
