export const POPULAR_DESTINATIONS = [
  { name: "Bali", tagline: "Pantai, pura, dan sawah terasering" },
  { name: "Yogyakarta", tagline: "Budaya, candi, dan kuliner" },
  { name: "Bandung", tagline: "Kota kembang berhawa sejuk" },
  { name: "Lombok", tagline: "Pantai jernih dan Rinjani" },
  { name: "Labuan Bajo", tagline: "Gerbang Pulau Komodo" },
  { name: "Raja Ampat", tagline: "Surga bawah laut Papua" },
  { name: "Malang", tagline: "Wisata alam dan kota tua" },
  { name: "Jakarta", tagline: "Museum, belanja, dan hiburan" },
] as const;

export const QUICK_DESTINATIONS = [
  "Bali",
  "Yogyakarta",
  "Bandung",
  "Lombok",
  "Labuan Bajo",
] as const;

export const SAMPLE_ITINERARY = {
  title: "Contoh: 3 hari di Yogyakarta",
  days: [
    {
      label: "Hari 1",
      theme: "Candi dan sunset",
      stops: [
        { time: "07:00", name: "Candi Prambanan" },
        { time: "11:30", name: "Keraton Yogyakarta" },
        { time: "17:30", name: "Tebing Breksi" },
      ],
    },
    {
      label: "Hari 2",
      theme: "Budaya dan belanja",
      stops: [
        { time: "08:00", name: "Taman Sari" },
        { time: "10:30", name: "Museum Sonobudoyo" },
        { time: "15:00", name: "Jalan Malioboro" },
      ],
    },
    {
      label: "Hari 3",
      theme: "Alam dan pantai",
      stops: [
        { time: "06:00", name: "Puncak Becici" },
        { time: "10:00", name: "Hutan Pinus Mangunan" },
        { time: "15:00", name: "Pantai Parangtritis" },
      ],
    },
  ],
} as const;

export const FAQ_ITEMS = [
  {
    question: "Apakah Triply bisa dipakai untuk memesan tiket atau hotel?",
    answer:
      "Belum. Triply fokus pada perencanaan: mencari tempat, menyusun itinerary, melihat rute, dan mencatat budget. Pemesanan dilakukan di platform lain.",
  },
  {
    question: "Dari mana data tempat dan foto berasal?",
    answer:
      "Data tempat dan rute dari OpenStreetMap lewat Geoapify. Foto diambil dari Wikipedia/Wikimedia Commons bila tersedia. Kalau tidak ada foto, kartu menampilkan ikon kategori.",
  },
  {
    question: "Bagaimana cara membagikan rencana ke teman?",
    answer:
      "Buka perjalanan, klik Bagikan, lalu buat tautan publik. Siapa pun dengan tautan bisa melihat itinerary dan peta. Budget dan pengeluaran tidak ikut dibagikan, dan tautan bisa dimatikan kapan saja.",
  },
  {
    question: "Bagaimana cara masuk?",
    answer:
      "Masuk dengan akun Google. Tidak ada password baru yang perlu diingat.",
  },
] as const;
