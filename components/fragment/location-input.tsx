"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { PlaceSuggestionDTO } from "@/@type/place";

type LocationInputProps = {
  value: string;
  onValueChange: (value: string) => void;
  onSelect?: (suggestion: PlaceSuggestionDTO, label: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
  onBlur?: () => void;
};

export function LocationInput({
  value,
  onValueChange,
  onSelect,
  placeholder,
  className,
  id,
  name,
  onBlur,
}: LocationInputProps) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestionDTO[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const text = value.trim();
    if (text.length < 2 || !open) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      apiGet<PlaceSuggestionDTO[]>(
        `/places/autocomplete?input=${encodeURIComponent(text)}`,
        { signal: controller.signal },
      )
        .then(setSuggestions)
        .catch(() => setSuggestions([]));
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, open]);

  return (
    <div className="relative">
      <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
      <input
        id={id}
        name={name}
        value={value}
        onChange={(event) => {
          onValueChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setTimeout(() => setOpen(false), 150);
          onBlur?.();
        }}
        placeholder={placeholder}
        autoComplete="off"
        className={cn(
          "w-full rounded-lg border border-neutral-300 bg-white py-2.5 pl-9 pr-3 text-sm",
          className,
        )}
      />
      {open && suggestions.length > 0 ? (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
          {suggestions.map((suggestion) => (
            <li key={suggestion.key}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  const label = [
                    suggestion.primaryText,
                    suggestion.secondaryText,
                  ]
                    .filter(Boolean)
                    .join(", ");
                  onValueChange(label);
                  setOpen(false);
                  setSuggestions([]);
                  onSelect?.(suggestion, label);
                }}
                className="block w-full px-3 py-2 text-left hover:bg-neutral-50"
              >
                <span className="block text-sm font-medium text-neutral-900">
                  {suggestion.primaryText}
                </span>
                {suggestion.secondaryText ? (
                  <span className="block text-xs text-neutral-500">
                    {suggestion.secondaryText}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
