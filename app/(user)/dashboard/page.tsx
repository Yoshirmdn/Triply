import Link from "next/link";
import {
  CalendarDays,
  Compass,
  Heart,
  Map,
  Search,
  Share2,
  Wallet,
} from "lucide-react";
import { siteConfig } from "@/data/site";

const features = [
  {
    icon: Compass,
    title: "Jelajahi destinasi",
    text: "Cari wisata, restoran, kafe, hotel, dan museum langsung dari data OpenStreetMap.",
  },
  {
    icon: CalendarDays,
    title: "Itinerary per hari",
    text: "Susun rencana tiap hari dengan jam kunjungan, catatan, dan urutan yang bisa diseret.",
  },
  {
    icon: Map,
    title: "Peta dan rute",
    text: "Lihat semua destinasi di peta, hitung jarak dan estimasi waktu tempuh antar titik.",
  },
  {
    icon: Wallet,
    title: "Budget perjalanan",
    text: "Catat pengeluaran per kategori dan pantau sisa budget dalam Rupiah.",
  },
  {
    icon: Heart,
    title: "Tempat favorit",
    text: "Simpan tempat yang menarik dan tambahkan ke itinerary kapan saja.",
  },
  {
    icon: Share2,
    title: "Bagikan rencana",
    text: "Buat tautan publik agar teman dan keluarga bisa melihat itinerary kamu.",
  },
];

const steps = [
  {
    title: "Buat perjalanan",
    text: "Tentukan destinasi, tanggal, jumlah traveler, dan estimasi budget.",
  },
  {
    title: "Susun itinerary",
    text: "Tambahkan tempat ke tiap hari lalu atur urutannya dengan drag and drop.",
  },
  {
    title: "Pantau rute dan biaya",
    text: "Cek rute di peta dan catat pengeluaran selama perjalanan.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-50">
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-teal-900"
          >
            {siteConfig.name}
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-neutral-600 md:flex">
            <a href="#fitur" className="hover:text-neutral-900">
              Fitur
            </a>
            <a href="#cara-kerja" className="hover:text-neutral-900">
              Cara kerja
            </a>
            <a href="#pratinjau" className="hover:text-neutral-900">
              Pratinjau
            </a>
          </nav>
          <Link
            href="/login"
            className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-900"
          >
            Masuk
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-20 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-teal-800">
            {siteConfig.tagline}
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-neutral-900 sm:text-6xl">
            Your Next Adventure Starts Here.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-neutral-600">
            Discover destinations, organize your itinerary, visualize your
            routes, and manage your travel budget — all in one place.
          </p>

          <form
            action="/dashboard/explore"
            method="get"
            className="mx-auto mt-10 flex max-w-xl items-center gap-2 rounded-xl border border-neutral-200 bg-white p-2 shadow-sm"
          >
            <Search className="ml-2 size-5 shrink-0 text-neutral-400" />
            <input
              name="q"
              placeholder="Mau ke mana? Cari kota atau tempat"
              className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-neutral-400"
            />
            <button
              type="submit"
              className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900"
            >
              Cari
            </button>
          </form>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg bg-teal-800 px-6 py-3 text-sm font-medium text-white transition hover:bg-teal-900"
            >
              Mulai Rencanakan
            </Link>
            <a
              href="#fitur"
              className="rounded-lg border border-neutral-300 bg-white px-6 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              Jelajahi Fitur
            </a>
          </div>
        </section>

        <section className="border-y border-neutral-200 bg-white">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Semua rencana perjalanan, satu tempat
            </h2>
            <p className="mt-4 leading-relaxed text-neutral-600">
              Triply menggantikan catatan yang tercecer, spreadsheet budget, dan
              tab peta yang berserakan. Rencanakan perjalanan dari ide sampai
              hari keberangkatan dalam satu workspace yang rapi.
            </p>
          </div>
        </section>

        <section
          id="fitur"
          className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20"
        >
          <h2 className="text-center text-2xl font-semibold tracking-tight text-neutral-900">
            Fitur utama
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-neutral-200 bg-white p-6"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
                  <feature.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold text-neutral-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="cara-kerja"
          className="scroll-mt-20 border-y border-neutral-200 bg-white"
        >
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="text-center text-2xl font-semibold tracking-tight text-neutral-900">
              Cara kerja
            </h2>
            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {steps.map((step, index) => (
                <li key={step.title} className="space-y-3">
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-teal-800 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <h3 className="font-semibold text-neutral-900">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-neutral-600">
                    {step.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="pratinjau"
          className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20"
        >
          <h2 className="text-center text-2xl font-semibold tracking-tight text-neutral-900">
            Pratinjau dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-neutral-500">
            Ilustrasi tata letak, bukan data sebenarnya.
          </p>
          <div className="mt-10 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-neutral-200 px-4 py-3">
              <span className="size-2.5 rounded-full bg-neutral-200" />
              <span className="size-2.5 rounded-full bg-neutral-200" />
              <span className="size-2.5 rounded-full bg-neutral-200" />
            </div>
            <div className="grid gap-4 bg-neutral-50 p-6 md:grid-cols-4">
              {[0, 1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4"
                >
                  <div className="h-2.5 w-1/2 rounded bg-neutral-200" />
                  <div className="h-6 w-2/3 rounded bg-teal-100" />
                </div>
              ))}
              <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4 md:col-span-2">
                <div className="h-2.5 w-1/3 rounded bg-neutral-200" />
                <div className="h-2 w-full rounded bg-neutral-100" />
                <div className="h-2 w-5/6 rounded bg-neutral-100" />
                <div className="h-2 w-2/3 rounded bg-neutral-100" />
              </div>
              <div className="h-40 rounded-xl border border-neutral-200 bg-teal-50 md:col-span-2" />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24">
          <div className="rounded-2xl bg-teal-900 px-6 py-14 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Plan Less. Explore More.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-teal-100">
              Masuk dengan Google dan buat rencana perjalanan pertamamu hari
              ini.
            </p>
            <Link
              href="/dashboard"
              className="mt-8 inline-flex rounded-lg bg-white px-6 py-3 text-sm font-medium text-teal-900 transition hover:bg-teal-50"
            >
              Mulai Rencanakan
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm text-neutral-500">
          <span>
            © {siteConfig.name}. {siteConfig.tagline}
          </span>
          <span>Dibuat untuk para pejalan.</span>
        </div>
      </footer>
    </div>
  );
}
