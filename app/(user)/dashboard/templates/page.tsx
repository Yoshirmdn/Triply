import { requirePageUser } from "@/lib/permissions";
import { countNearby } from "@/lib/catalog";
import { PlacePhoto } from "@/components/fragment/place-photo";
import { UseTemplateButton } from "@/components/fragment/use-template-button";
import { PACE_ACTIVITIES, TRIP_PACE_LABELS, TRIP_STYLE_LABELS } from "@/data/generator";
import { TRIP_TEMPLATES } from "@/data/templates";

export const metadata = { title: "Template perjalanan" };

type TemplatesPageProps = {
  searchParams: Promise<{ pakai?: string }>;
};

export default async function TemplatesPage({ searchParams }: TemplatesPageProps) {
  await requirePageUser();
  const { pakai } = await searchParams;

  const counts = await Promise.all(
    TRIP_TEMPLATES.map((template) =>
      countNearby(template.latitude, template.longitude, template.radius).catch(() => 0),
    ),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Template perjalanan</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Pilih satu, tentukan tanggal, dan itinerary langsung tersusun. Semuanya bisa kamu ubah di planner.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TRIP_TEMPLATES.map((template, index) => {
          const count = counts[index];
          const needed = template.days * (PACE_ACTIVITIES[template.pace] + 3);
          return (
            <article key={template.id} className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              <PlacePhoto
                kind="destination"
                name={template.destination}
                className="h-40 w-full"
                iconClassName="size-10"
                showCredit
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-neutral-800">
                  {template.days} hari
                </span>
              </PlacePhoto>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="space-y-1">
                  <h2 className="font-semibold text-neutral-900">{template.title}</h2>
                  <p className="text-sm text-neutral-600">{template.tagline}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <span className="rounded-full bg-teal-50 px-2.5 py-0.5 font-medium text-teal-800">
                    {TRIP_STYLE_LABELS[template.style]}
                  </span>
                  <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 font-medium text-neutral-700">
                    {TRIP_PACE_LABELS[template.pace]}
                  </span>
                </div>
                {count < needed ? (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Data tempat di area ini masih sedikit ({count}), itinerary bisa kurang lengkap.
                  </p>
                ) : (
                  <p className="text-xs text-neutral-500">{count} tempat tersedia di area ini</p>
                )}
                <div className="mt-auto pt-2">
                  <UseTemplateButton
                    templateId={template.id}
                    title={template.title}
                    days={template.days}
                    dailyBudget={template.dailyBudget}
                    defaultOpen={pakai === template.id}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}