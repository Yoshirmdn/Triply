"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { ApiClientError, apiDelete, apiPost } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { PlaceInput } from "@/lib/validations/place.schema";

type FavoriteButtonProps = {
  place: PlaceInput;
  initialFavorite: boolean;
  onChange?: (isFavorite: boolean) => void;
};

export function FavoriteButton({
  place,
  initialFavorite,
  onChange,
}: FavoriteButtonProps) {
  const [active, setActive] = useState(initialFavorite);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setLoading(true);
    setError(null);
    try {
      if (active) {
        await apiDelete(`/favorites/${place.placeId}`);
      } else {
        await apiPost("/favorites", { place });
      }
      const next = !active;
      setActive(next);
      onChange?.(next);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Gagal memperbarui favorit",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        aria-pressed={active}
        aria-label={active ? "Hapus dari favorit" : "Simpan ke favorit"}
        className={cn(
          "rounded-full border p-2 transition disabled:opacity-60",
          active
            ? "border-rose-200 bg-rose-50 text-rose-600"
            : "border-neutral-200 bg-white text-neutral-500 hover:text-rose-600",
        )}
      >
        <Heart className={cn("size-4", active && "fill-current")} />
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
