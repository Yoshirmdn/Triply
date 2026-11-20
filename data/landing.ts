export const POPULAR_DESTINATIONS = [
  { name: "Yogyakarta", tagline: "Candi, keraton, dan jajanan malam" },
  { name: "Bandung", tagline: "Kota kembang berhawa sejuk" },
  { name: "Jakarta", tagline: "Museum, kota tua, dan belanja" },
  {
    name: "Pangandaran",
    tagline: "Pantai dan wisata air di selatan Jawa Barat",
  },
  { name: "Lembang", tagline: "Kebun, kafe, dan udara pegunungan" },
  { name: "Bogor", tagline: "Kebun raya dan kuliner hujan" },
  { name: "Solo", tagline: "Batik, keraton, dan kuliner khas" },
] as const;

export const QUICK_DESTINATIONS = [
  "Yogyakarta",
  "Bandung",
  "Jakarta",
  "Pangandaran",
  "Lembang",
] as const;

export const SAMPLE_ITINERARY = {
  title: "Contoh: 2 hari di Bandung",
  days: [
    {
      label: "Hari 1",
      theme: "Alam dan kafe",
      stops: [
        { time: "09:00", name: "Tempat wisata alam terdekat", kind: "Wisata" },
        {
          time: "12:00",
          name: "Makan siang di restoran populer",
          kind: "Makan siang",
        },
        { time: "14:30", name: "Wisata kota atau museum", kind: "Wisata" },
        { time: "18:30", name: "Makan malam", kind: "Makan malam" },
      ],
    },
    {
      label: "Hari 2",
      theme: "Belanja dan kuliner",
      stops: [
        {
          time: "09:00",
          name: "Pusat perbelanjaan atau pasar",
          kind: "Belanja",
        },
        {
          time: "12:00",
          name: "Makan siang di restoran populer",
          kind: "Makan siang",
        },
        { time: "15:30", name: "Ngopi di kafe", kind: "Kafe" },
        { time: "18:30", name: "Makan malam", kind: "Makan malam" },
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
      "Data tempat, rating, dan foto berasal dari katalog Google Maps, peta dari OpenStreetMap, dan rute dari Geoapify. Kalau foto tidak tersedia, kartu menampilkan ikon kategori.",
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
