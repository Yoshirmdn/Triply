import { ExploreClient } from "@/components/fragment/explore-client";

export const metadata = { title: "Jelajahi" };

export default function ExplorePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Jelajahi</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Cari lokasi, pilih kategori, lalu masukkan tempat ke itinerary
          perjalananmu.
        </p>
      </div>
      <ExploreClient />
    </div>
  );
}
