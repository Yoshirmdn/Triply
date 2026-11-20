import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Snowflake,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { weatherInfo, type WeatherIcon } from "@/utils/weather";
import type { DayWeatherDTO } from "@/@type/trip-extra";

const ICONS: Record<WeatherIcon, LucideIcon> = {
  sun: Sun,
  partly: CloudSun,
  cloud: Cloud,
  fog: CloudFog,
  rain: CloudRain,
  storm: CloudLightning,
  snow: Snowflake,
};

type WeatherBadgeProps = {
  weather: DayWeatherDTO;
  compact?: boolean;
};

export function WeatherBadge({ weather, compact = false }: WeatherBadgeProps) {
  const info = weatherInfo(weather.code);
  const Icon = ICONS[info.icon];

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-800">
      <Icon className="size-3.5" />
      {compact ? null : <span>{info.label}</span>}
      <span>
        {weather.min}–{weather.max}°C
      </span>
      {weather.rainChance !== null && weather.rainChance >= 30 ? (
        <span>· {weather.rainChance}% hujan</span>
      ) : null}
    </span>
  );
}
