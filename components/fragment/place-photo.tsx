"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Coffee, Hotel, Landmark, MapPin, ShoppingBag, Ticket, Trees, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { PlaceCategoryValue } from "@/data/places";
import type { PlacePhotoDTO } from "@/@type/place";

const ICONS: Record<PlaceCategoryValue, LucideIcon> = {
  ATTRACTION: Landmark,
  RESTAURANT: UtensilsCrossed,
  CAFE: Coffee,
  HOTEL: Hotel,
  SHOPPING: ShoppingBag,
  MUSEUM: Landmark,
  NATURE: Trees,
  ENTERTAINMENT: Ticket,
  OTHER: MapPin,
};

const GRADIENTS: Record<PlaceCategoryValue, string> = {
  ATTRACTION: "from-teal-700 to-emerald-500",
  RESTAURANT: "from-orange-600 to-amber-400",
  CAFE: "from-amber-700 to-yellow-500",
  HOTEL: "from-sky-700 to-cyan-500",
  SHOPPING: "from-pink-600 to-rose-400",
  MUSEUM: "from-violet-700 to-purple-500",
  NATURE: "from-green-700 to-lime-500",
  ENTERTAINMENT: "from-fuchsia-700 to-pink-500",
  OTHER: "from-teal-800 to-teal-500",
};

const MAX_CONCURRENT = 4;

const resolved = new Map<string, PlacePhotoDTO | null>();
const inflight = new Map<string, Promise<PlacePhotoDTO | null>>();
const waiting: (() => void)[] = [];
let active = 0;

async function limited<T>(task: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENT) await new Promise<void>((resolve) => waiting.push(resolve));
  active += 1;
  try {
    return await task();
  } finally {
    active -= 1;
    waiting.shift()?.();
  }
}

function loadPhoto(key: string, path: string): Promise<PlacePhotoDTO | null> {
  const existing = inflight.get(key);
  if (existing) return existing;
  const promise = limited(() => apiGet<PlacePhotoDTO | null>(path))
    .catch(() => null)
    .then((photo) => {
      resolved.set(key, photo);
      inflight.delete(key);
      return photo;
    });
  inflight.set(key, promise);
  return promise;
}

type PlacePhotoProps = {
  name: string;
  latitude?: number;
  longitude?: number;
  category?: PlaceCategoryValue;
  kind?: "place" | "destination";
  src?: string | null;
  className?: string;
  iconClassName?: string;
  showCredit?: boolean;
  children?: ReactNode;
};

export function PlacePhoto({
  name,
  latitude,
  longitude,
  category = "OTHER",
  kind = "place",
  src,
  className,
  iconClassName,
  showCredit = false,
  children,
}: PlacePhotoProps) {
  const key = [kind, name, latitude?.toFixed(4) ?? "", longitude?.toFixed(4) ?? ""].join("|");
  const [loaded, setLoaded] = useState<{ key: string; photo: PlacePhotoDTO | null } | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    if (src || resolved.has(key)) return;
    let cancelled = false;
    const params = new URLSearchParams({ name, kind });
    if (latitude !== undefined && longitude !== undefined) {
      params.set("lat", String(latitude));
      params.set("lng", String(longitude));
    }
    void loadPhoto(key, `/places/photo?${params.toString()}`).then((photo) => {
      if (!cancelled) setLoaded({ key, photo });
    });
    return () => {
      cancelled = true;
    };
  }, [key, src, name, kind, latitude, longitude]);

  const cached = resolved.get(key);
  const fetched = cached !== undefined ? cached : loaded?.key === key ? loaded.photo : undefined;
  const photo: PlacePhotoDTO | null | undefined = src ? { url: src, title: name, pageUrl: src } : fetched;
  const Icon = ICONS[category];
  const showImage = photo && failed !== photo.url;

    return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-br",
        GRADIENTS[category],
        photo === undefined && "animate-pulse",
        className,
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.url}
          alt={photo.title ?? name}
          loading="lazy"
          onError={() => setFailed(photo.url)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : photo === null || (photo && failed === photo.url) ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className={cn("h-8 w-8 text-white/80", iconClassName)} />
        </div>
      ) : null}

      {showCredit && showImage ? (
        <p className="absolute bottom-2 right-2 text-right text-xs text-white drop-shadow-md">
          Foto dari Google Maps (katalog lokal) · <span className="underline">© OpenStreetMap contributors</span>
        </p>
      ) : null}

      {children}
    </div>
  );
}