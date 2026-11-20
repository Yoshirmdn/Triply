export type WeatherIcon =
  | "sun"
  | "partly"
  | "cloud"
  | "fog"
  | "rain"
  | "storm"
  | "snow";

export function weatherInfo(code: number): {
  label: string;
  icon: WeatherIcon;
} {
  if (code === 0) return { label: "Cerah", icon: "sun" };
  if (code === 1 || code === 2)
    return { label: "Cerah berawan", icon: "partly" };
  if (code === 3) return { label: "Berawan", icon: "cloud" };
  if (code === 45 || code === 48) return { label: "Berkabut", icon: "fog" };
  if (code >= 51 && code <= 57) return { label: "Gerimis", icon: "rain" };
  if (code >= 61 && code <= 67) return { label: "Hujan", icon: "rain" };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return { label: "Salju", icon: "snow" };
  if (code >= 80 && code <= 82) return { label: "Hujan lokal", icon: "rain" };
  if (code >= 95) return { label: "Badai petir", icon: "storm" };
  return { label: "Berawan", icon: "cloud" };
}
