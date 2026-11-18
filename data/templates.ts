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
    id: "bali-santai-4",
    title: "Bali 4 hari santai",
    destination: "Bali",
    tagline: "Pura, sawah, dan pantai tanpa terburu-buru",
    description:
      "Rencana santai dua tempat per hari di sekitar Ubud dan Bali selatan, dengan waktu makan dan istirahat yang longgar.",
    latitude: -8.5069,
    longitude: 115.2625,
    radius: 30000,
    days: 4,
    style: "BALANCED",
    pace: "RELAXED",
    dailyBudget: 600000,
  },
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
    id: "lombok-alam-4",
    title: "Lombok 4 hari alam",
    destination: "Lombok",
    tagline: "Pantai, air terjun, dan perbukitan",
    description:
      "Fokus ke pantai dan alam di sekitar Mataram dan Senggigi. Jarak antartempat di Lombok cukup jauh, jadi jadwal dibuat santai.",
    latitude: -8.5833,
    longitude: 116.1167,
    radius: 40000,
    days: 4,
    style: "NATURE",
    pace: "RELAXED",
    dailyBudget: 500000,
  },
  {
    id: "malang-alam-3",
    title: "Malang dan Batu 3 hari",
    destination: "Malang",
    tagline: "Udara sejuk, taman, dan wisata alam",
    description: "Tiga hari di Malang dan Batu dengan banyak ruang terbuka.",
    latitude: -7.9666,
    longitude: 112.6326,
    radius: 30000,
    days: 3,
    style: "NATURE",
    pace: "NORMAL",
    dailyBudget: 350000,
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
    id: "surabaya-belanja-3",
    title: "Surabaya 3 hari belanja",
    destination: "Surabaya",
    tagline: "Mal, hiburan, dan kuliner khas",
    description:
      "Tiga hari di Surabaya dengan porsi belanja dan hiburan yang lebih banyak.",
    latitude: -7.2575,
    longitude: 112.7521,
    radius: 15000,
    days: 3,
    style: "SHOPPING",
    pace: "NORMAL",
    dailyBudget: 400000,
  },
];

export function getTemplate(id: string): TripTemplate | undefined {
  return TRIP_TEMPLATES.find((template) => template.id === id);
}
