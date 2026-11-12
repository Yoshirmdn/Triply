import { ExploreClient } from "@/components/fragment/explore-client";

export const metadata = { title: "Jelajahi" };

type ExplorePageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const { q } = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Jelajahi</h1>
        <p className="mt-1 text-sm text-neutral-600">Cari lokasi, pilih kategori, lalu masukkan tempat ke itinerary perjalananmu.</p>
      </div>
      <ExploreClient initialQuery={typeof q === "string" ? q.slice(0, 120) : ""} />
    </div>
  );
}