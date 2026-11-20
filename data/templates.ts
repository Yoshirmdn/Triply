import type { TripPaceValue, TripStyleValue } from "@/data/generator";

export type TripTemplate = {
  id: string;
  title: string;
  destination: string;
  tagline: string;
  description: string;
  latitude: number;
  longitude: number;
  radius: number;
  days: number;
  style: TripStyleValue;
  pace: TripPaceValue;
  dailyBudget: number;
};

export const TRIP_TEMPLATES: TripTemplate[] = [
  {
    id: "yogyakarta-budaya-3",
    title: "Yogyakarta 3 hari budaya",
    destination: "Yogyakarta",
    tagline: "Candi, keraton, museum, dan jajanan",
    description:
      "Tiga hari menjelajah situs sejarah dan museum di Kota Yogyakarta dan sekitarnya.",
    latitude: -7.7956,
    longitude: 110.3695,
    radius: 15000,
    days: 3,
    style: "CULTURE",
    pace: "NORMAL",
    dailyBudget: 400000,
  },
  {
    id: "bandung-kuliner-3",
    title: "Bandung 3 hari kuliner",
    destination: "Bandung",
    tagline: "Sarapan, kafe, dan makan malam favorit",
    description:
      "Tiga hari dengan tiga waktu makan per hari, dari restoran sampai kafe, diselingi wisata ringan.",
    latitude: -6.9175,
    longitude: 107.6191,
    radius: 15000,
    days: 3,
    style: "FOOD",
    pace: "NORMAL",
    dailyBudget: 450000,
  },
  {
    id: "jakarta-padat-3",
    title: "Jakarta 3 hari padat",
    destination: "Jakarta",
    tagline: "Museum, kota tua, belanja, dan hiburan",
    description:
      "Empat tempat per hari di Jakarta, campuran sejarah, belanja, dan hiburan.",
    latitude: -6.1754,
    longitude: 106.8272,
    radius: 15000,
    days: 3,
    style: "BALANCED",
    pace: "PACKED",
    dailyBudget: 700000,
  },
  {
    id: "pangandaran-pantai-3",
    title: "Pangandaran 3 hari pantai",
    destination: "Pangandaran",
    tagline: "Pantai, cagar alam, dan seafood",
    description:
      "Tiga hari santai di pantai dan alam Pangandaran. Jarak antartempat cukup jauh, jadi jadwal dibuat longgar.",
    latitude: -7.685,
    longitude: 108.65,
    radius: 25000,
    days: 3,
    style: "NATURE",
    pace: "RELAXED",
    dailyBudget: 350000,
  },
  {
    id: "bandung-akhir-pekan-2",
    title: "Bandung akhir pekan",
    destination: "Bandung",
    tagline: "Dua hari padat untuk liburan singkat",
    description:
      "Empat tempat per hari supaya akhir pekan yang singkat tetap terasa penuh.",
    latitude: -6.9175,
    longitude: 107.6191,
    radius: 15000,
    days: 2,
    style: "BALANCED",
    pace: "PACKED",
    dailyBudget: 450000,
  },
  {
    id: "lembang-santai-2",
    title: "Lembang 2 hari santai",
    destination: "Lembang",
    tagline: "Kebun, kafe, dan udara sejuk",
    description:
      "Dua hari santai di Lembang dengan banyak ruang terbuka dan waktu ngopi.",
    latitude: -6.8117,
    longitude: 107.6177,
    radius: 8000,
    days: 2,
    style: "NATURE",
    pace: "RELAXED",
    dailyBudget: 400000,
  },
  {
    id: "yogyakarta-akhir-pekan-2",
    title: "Yogyakarta akhir pekan",
    destination: "Yogyakarta",
    tagline: "Dua hari untuk intisari kota",
    description:
      "Campuran wisata, museum, dan kuliner dalam dua hari yang padat.",
    latitude: -7.7956,
    longitude: 110.3695,
    radius: 15000,
    days: 2,
    style: "BALANCED",
    pace: "PACKED",
    dailyBudget: 400000,
  },
  {
    id: "solo-budaya-3",
    title: "Solo 3 hari budaya",
    destination: "Solo",
    tagline: "Keraton, batik, dan kuliner khas",
    description: "Tiga hari menyusuri keraton, museum, dan pasar di Kota Solo.",
    latitude: -7.5666,
    longitude: 110.8283,
    radius: 12000,
    days: 3,
    style: "CULTURE",
    pace: "NORMAL",
    dailyBudget: 300000,
  },
  {
    id: "bogor-akhir-pekan-2",
    title: "Bogor akhir pekan",
    destination: "Bogor",
    tagline: "Kebun, museum, dan kuliner",
    description:
      "Dua hari di Bogor dengan taman, museum, dan tempat makan favorit.",
    latitude: -6.595,
    longitude: 106.8166,
    radius: 12000,
    days: 2,
    style: "BALANCED",
    pace: "NORMAL",
    dailyBudget: 350000,
  },
];

export function getTemplate(id: string): TripTemplate | undefined {
  return TRIP_TEMPLATES.find((template) => template.id === id);
}
