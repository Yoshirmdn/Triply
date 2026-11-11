"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed } from "lucide-react";
import { ApiClientError, apiGet } from "@/lib/api-client";
import { LocationInput } from "@/components/fragment/location-input";
import { PlaceCard } from "@/components/fragment/place-card";
import { PlacesMap } from "@/components/fragment/places-map";
import {
  FILTERABLE_CATEGORIES,
  PLACE_CATEGORY_LABELS,
  type PlaceCategoryValue,
} from "@/data/places";
import { cn } from "@/lib/utils";
import type { PlaceDTO, PlaceSuggestionDTO } from "@/@type/place";

type ResultPlace = PlaceDTO & { isFavorite: boolean };
type Coords = { latitude: number; longitude: number };

export function ExploreClient() {
  const [query, setQuery] = useState("");
  const [center, setCenter] = useState<Coords | null>(null);
  const [userLocation, setUserLocation] = useState<Coords | null>(null);
  const [category, setCategory] = useState<PlaceCategoryValue | null>(null);
  const [results, setResults] = useState<ResultPlace[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchController = useRef<AbortController | null>(null);

  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("q");
    if (initial) {
      setQuery(initial);
      void runSearch(initial, null, null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runSearch(
    text: string,
    nextCenter: Coords | null,
    nextCategory: PlaceCategoryValue | null,
  ) {
    const trimmed = text.trim();
    if (!nextCenter && trimmed.length < 2) return;
    searchController.current?.abort();
    const controller = new AbortController();
    searchController.current = controller;

    setLoading(true);
    setError(null);
    setActiveId(null);

    const params = new URLSearchParams();
    if (nextCenter) {
      params.set("lat", String(nextCenter.latitude));
      params.set("lng", String(nextCenter.longitude));
    } else {
      params.set("q", trimmed);
    }
    if (nextCategory) params.set("category", nextCategory);

    try {
      const data = await apiGet<ResultPlace[]>(
        `/places/search?${params.toString()}`,
        { signal: controller.signal },
      );
      setResults(data);
      if (!nextCenter && data.length > 0) {
        setCenter({ latitude: data[0].latitude, longitude: data[0].longitude });
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      setResults(null);
      setError(
        err instanceof ApiClientError ? err.message : "Gagal mencari tempat",
      );
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  function pickCategory(value: PlaceCategoryValue | null) {
    setCategory(value);
    void runSearch(query, center, value);
  }

  function pickSuggestion(suggestion: PlaceSuggestionDTO, label: string) {
    const next = {
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    };
    setCenter(next);
    void runSearch(label, next, category);
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
        void runSearch("Lokasi saya", next, category);
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

  return (
    <div className="space-y-6">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void runSearch(query, center, category);
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
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-36 animate-pulse rounded-xl bg-neutral-200"
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
              Tidak ada tempat di sekitar lokasi ini. Coba kategori atau lokasi
              lain.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {results.map((place) => (
                <div
                  key={place.placeId}
                  onMouseEnter={() => setActiveId(place.placeId)}
                  className={cn(
                    "rounded-xl transition",
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
        </a>
      </p>
    </div>
  );
}
