"use client";

import { useState } from "react";
import Link from "next/link";
import { Bed, Bus, ExternalLink, Plane, TrainFront } from "lucide-react";
import { LocationInput } from "@/components/fragment/location-input";
import {
  bookingHotelsUrl,
  busSearchUrl,
  googleFlightsUrl,
  trainSearchUrl,
} from "@/lib/travel-links";

type TravelLinksProps = {
  tripId: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
};

type LinkItem = {
  label: string;
  hint: string;
  href: string;
  needsOrigin: boolean;
  icon: typeof Plane;
};

export function TravelLinks({
  tripId,
  destination,
  startDate,
  endDate,
  travelers,
}: TravelLinksProps) {
  const [origin, setOrigin] = useState("");
  const hasOrigin = origin.trim().length >= 2;

  const items: LinkItem[] = [
    {
      label: "Tiket pesawat",
      hint: "Google Flights",
      href: googleFlightsUrl({ origin, destination, startDate, endDate }),
      needsOrigin: true,
      icon: Plane,
    },
    {
      label: "Hotel dan penginapan",
      hint: "Booking.com",
      href: bookingHotelsUrl({ destination, startDate, endDate, travelers }),
      needsOrigin: false,
      icon: Bed,
    },
    {
      label: "Tiket bus",
      hint: "Hasil pencarian web",
      href: busSearchUrl(origin, destination),
      needsOrigin: true,
      icon: Bus,
    },
    {
      label: "Tiket kereta",
      hint: "Hasil pencarian web",
      href: trainSearchUrl(origin, destination),
      needsOrigin: true,
      icon: TrainFront,
    },
  ];

  return (
    <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">
          Cari tiket dan penginapan
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Triply tidak menampilkan harga sendiri. Tombol di bawah membuka situs
          pihak ketiga dengan tujuan dan tanggal perjalanan ini. Setelah
          membeli, catat biayanya di{" "}
          <Link
            href={`/dashboard/trips/${tripId}/budget`}
            className="font-medium text-teal-800 hover:underline"
          >
            halaman Budget
          </Link>
          .
        </p>
      </div>

      <div className="space-y-1 text-sm">
        <p className="font-medium text-neutral-800">Berangkat dari</p>
        <LocationInput
          value={origin}
          onValueChange={setOrigin}
          placeholder="Kota asal, mis. Jakarta"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const disabled = item.needsOrigin && !hasOrigin;
          return (
            <a
              key={item.label}
              href={disabled ? undefined : item.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={disabled}
              className={
                disabled
                  ? "flex cursor-not-allowed items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 opacity-60"
                  : "flex items-center gap-3 rounded-xl border border-neutral-200 p-4 transition hover:border-teal-300 hover:bg-teal-50"
              }
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
                <item.icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-neutral-900">
                  {item.label}
                </span>
                <span className="block text-xs text-neutral-500">
                  {disabled ? "Isi kota asal dulu" : item.hint}
                </span>
              </span>
              <ExternalLink className="size-4 shrink-0 text-neutral-400" />
            </a>
          );
        })}
      </div>
    </section>
  );
}
