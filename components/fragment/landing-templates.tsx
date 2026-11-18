import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PlacePhoto } from "@/components/fragment/place-photo";
import { TRIP_PACE_LABELS, TRIP_STYLE_LABELS } from "@/data/generator";
import { TRIP_TEMPLATES } from "@/data/templates";

export function LandingTemplates() {
  const featured = TRIP_TEMPLATES.slice(0, 4);

  return (
    <section
      id="template"
      className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-20"
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            Mulai dari template
          </h2>
          <p className="mt-1 text-neutral-600">
            Pilih, tentukan tanggal, dan itinerary langsung tersusun. Tinggal
            diubah sesukamu.
          </p>
        </div>
        <Link
          href="/dashboard/templates"
          className="hidden items-center gap-1 text-sm font-semibold text-teal-800 hover:underline sm:inline-flex"
        >
          Lihat semua
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {featured.map((template) => (
          <Link
            key={template.id}
            href={`/dashboard/templates?pakai=${template.id}`}
            className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:shadow-md"
          >
            <PlacePhoto
              kind="destination"
              name={template.destination}
              className="h-36 w-full"
              iconClassName="size-10"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-neutral-800">
                {template.days} hari
              </span>
            </PlacePhoto>
            <div className="space-y-1 p-4">
              <h3 className="font-semibold text-neutral-900 group-hover:text-teal-800">
                {template.title}
              </h3>
              <p className="text-sm text-neutral-600">{template.tagline}</p>
              <p className="pt-1 text-xs text-neutral-400">
                {TRIP_STYLE_LABELS[template.style]} ·{" "}
                {TRIP_PACE_LABELS[template.pace]}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
