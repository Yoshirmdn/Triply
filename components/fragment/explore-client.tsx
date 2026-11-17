"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed, Search } from "lucide-react";
import { ApiClientError, apiGetWithMeta } from "@/lib/api-client";
import { LocationInput } from "@/components/fragment/location-input";
import { PlaceCard } from "@/components/fragment/place-card";
import { PlacesMap } from "@/components/fragment/places-map";
import {
  DEFAULT_SEARCH_RADIUS,
  FILTERABLE_CATEGORIES,
  PLACE_CATEGORY_LABELS,
  SEARCH_RADIUS_OPTIONS,
  type PlaceCategoryValue,
} from "@/data/places";
import { cn } from "@/lib/utils";
import type { PlaceDTO, PlaceSuggestionDTO } from "@/@type/place";

type ResultPlace = PlaceDTO & { isFavorite: boolean };
type Coords = { latitude: number; longitude: number };

type SearchOptions = {
  text: string;
  center: Coords | null;
  category: PlaceCategoryValue | null;
  radius: number;
  name: string;
  page: number;
};

function mergeUnique(
  current: ResultPlace[],
  incoming: ResultPlace[],
): ResultPlace[] {
  const seen = new Set(current.map((place) => place.placeId));
  return [...current, ...incoming.filter((place) => !seen.has(place.placeId))];
}

export function ExploreClient({
  initialQuery = "",
}: {
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [center, setCenter] = useState<Coords | null>(null);
  const [userLocation, setUserLocation] = useState<Coords | null>(null);
  const [category, setCategory] = useState<PlaceCategoryValue | null>(null);
  const [radius, setRadius] = useState<number>(DEFAULT_SEARCH_RADIUS);
  const [nameFilter, setNameFilter] = useState("");
  const [results, setResults] = useState<ResultPlace[] | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchController = useRef<AbortController | null>(null);

  useEffect(() => {
    if (initialQuery.trim().length < 2) return;
    const timer = setTimeout(
      () =>
        void runSearch({
          text: initialQuery,
          center: null,
          category: null,
          radius: DEFAULT_SEARCH_RADIUS,
          name: "",
          page: 1,
        }),
      0,
    );
    return () => clearTimeout(timer);
  }, [initialQuery]);

  function currentOptions(
    overrides: Partial<SearchOptions> = {},
  ): SearchOptions {
    return {
      text: query,
      center,
      category,
      radius,
      name: nameFilter,
      page: 1,
      ...overrides,
    };
  }

  async function runSearch(options: SearchOptions) {
    const trimmed = options.text.trim();
    if (!options.center && trimmed.length < 2) return;
    const append = options.page > 1;

    searchController.current?.abort();
    const controller = new AbortController();
    searchController.current = controller;

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setActiveId(null);
    }
    setError(null);

    const params = new URLSearchParams();
    if (options.center) {
      params.set("lat", String(options.center.latitude));
      params.set("lng", String(options.center.longitude));
    } else {
      params.set("q", trimmed);
    }
    if (options.category) params.set("category", options.category);
    if (options.name.trim().length >= 2)
      params.set("name", options.name.trim());
    params.set("radius", String(options.radius));
    params.set("page", String(options.page));

    try {
      const { data, meta } = await apiGetWithMeta<ResultPlace[]>(
        `/places/search?${params.toString()}`,
        {
          signal: controller.signal,
        },
      );
      setResults((current) =>
        append && current ? mergeUnique(current, data) : data,
      );
      setPage(options.page);
      setHasMore(Boolean(meta.hasMore));
      if (meta.center && !append) setCenter(meta.center);
    } catch (err) {
      if (controller.signal.aborted) return;
      if (!append) setResults(null);
      setError(
        err instanceof ApiClientError ? err.message : "Gagal mencari tempat",
      );
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }

  function pickCategory(value: PlaceCategoryValue | null) {
    setCategory(value);
    void runSearch(currentOptions({ category: value }));
  }

  function pickRadius(value: number) {
    setRadius(value);
    void runSearch(currentOptions({ radius: value }));
  }

  function pickSuggestion(suggestion: PlaceSuggestionDTO, label: string) {
    const next = {
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    };
    setCenter(next);
    void runSearch(currentOptions({ text: label, center: next }));
  }

  function locateMe() {
    if (!navigator.geolocation) {
      setError("Browser tidak mendukung lokasi");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserLocation(next);
        setCenter(next);
        setQuery("Lokasi saya");
        setLocating(false);
        void runSearch(currentOptions({ text: "Lokasi saya", center: next }));
      },
      () => {
        setLocating(false);
        setError(
          "Tidak bisa mengambil lokasi. Izinkan akses lokasi di browser.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function handleFavoriteChange(placeId: string, isFavorite: boolean) {
    setResults((current) =>
      current
        ? current.map((place) =>
            place.placeId === placeId ? { ...place, isFavorite } : place,
          )
        : current,
    );
  }

  const places = results ?? [];
  const radiusLabel =
    SEARCH_RADIUS_OPTIONS.find((option) => option.value === radius)?.label ??
    `${radius / 1000} km`;

  return (
    <div className="space-y-6">
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void runSearch(currentOptions());
        }}
      >
        <div className="flex flex-wrap gap-2">
          <div className="min-w-60 flex-1">
            <LocationInput
              value={query}
              onValueChange={(value) => {
                setQuery(value);
                setCenter(null);
              }}
              onSelect={pickSuggestion}
              placeholder="Masukkan lokasi, mis. Ubud, Bali"
            />
          </div>
          <button
            type="button"
            onClick={locateMe}
            disabled={locating}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 disabled:opacity-60"
          >
            <LocateFixed className="size-4" />
            {locating ? "Mencari..." : "Lokasi saya"}
          </button>
          <button
            type="submit"
            disabled={loading || query.trim().length < 2}
            className="rounded-lg bg-teal-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-900 disabled:opacity-50"
          >
            Cari
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <label className="relative min-w-60 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <span className="sr-only">Cari nama tempat</span>
            <input
              value={nameFilter}
              onChange={(event) => setNameFilter(event.target.value)}
              placeholder="Cari nama tempat (opsional), mis. Pantai Kuta"
              className="w-full rounded-lg border border-neutral-300 bg-white py-2.5 pl-9 pr-3 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            Radius
            <select
              value={radius}
              onChange={(event) => pickRadius(Number(event.target.value))}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm"
            >
              {SEARCH_RADIUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </form>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => pickCategory(null)}
          className={cn(
            "rounded-full border px-3 py-1 text-sm transition",
            category === null
              ? "border-teal-800 bg-teal-800 text-white"
              : "border-neutral-300 bg-white text-neutral-700 hover:border-teal-300",
          )}
        >
          Semua
        </button>
        {FILTERABLE_CATEGORIES.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => pickCategory(value)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition",
              category === value
                ? "border-teal-800 bg-teal-800 text-white"
                : "border-neutral-300 bg-white text-neutral-700 hover:border-teal-300",
            )}
          >
            {PLACE_CATEGORY_LABELS[value]}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-64 animate-pulse rounded-2xl bg-neutral-200"
                />
              ))}
            </div>
          ) : results === null ? (
            !error ? (
              <p className="py-12 text-center text-sm text-neutral-500">
                Masukkan lokasi atau gunakan lokasimu, lalu pilih kategori untuk
                menemukan tempat di sekitarnya.
              </p>
            ) : null
          ) : results.length === 0 ? (
            <p className="py-12 text-center text-sm text-neutral-500">
              Tidak ada tempat dalam radius {radiusLabel}. Perbesar radius,
              ganti kategori, atau coba lokasi lain.
            </p>
          ) : (
            <>
              <p className="text-sm text-neutral-500">
                {results.length} tempat dalam radius {radiusLabel}
                {hasMore ? " (masih ada lagi)" : ""}
              </p>
              <div className="grid gap-5 sm:grid-cols-2">
                {results.map((place) => (
                  <div
                    key={place.placeId}
                    onMouseEnter={() => setActiveId(place.placeId)}
                    className={cn(
                      "rounded-2xl transition",
                      activeId === place.placeId && "ring-2 ring-amber-400",
                    )}
                  >
                    <PlaceCard
                      place={place}
                      onFavoriteChange={handleFavoriteChange}
                    />
                  </div>
                ))}
              </div>
              {hasMore ? (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      void runSearch(currentOptions({ page: page + 1 }))
                    }
                    disabled={loadingMore}
                    className="rounded-lg border border-neutral-300 bg-white px-6 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 disabled:opacity-60"
                  >
                    {loadingMore ? "Memuat..." : "Muat lebih banyak"}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="h-80 lg:sticky lg:top-20 lg:col-span-2 lg:h-[70vh]">
          <PlacesMap
            center={center}
            places={places}
            activeId={activeId}
            onSelect={setActiveId}
            userLocation={userLocation}
          />
        </div>
      </div>

      <p className="text-right text-xs text-neutral-400">
        Powered by{" "}
        <a
          href="https://www.geoapify.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Geoapify
        </a>{" "}
        ·{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          © OpenStreetMap contributors
        </a>{" "}
        · Foto dari Wikipedia/Wikimedia Commons
      </p>
    </div>
  );
}
