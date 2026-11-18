import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Compass,
  Heart,
  Map,
  Route,
  Search,
  Share2,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { siteConfig } from "@/data/site";
import {
  FAQ_ITEMS,
  POPULAR_DESTINATIONS,
  QUICK_DESTINATIONS,
  SAMPLE_ITINERARY,
} from "@/data/landing";
import { resolveActor } from "@/lib/permissions";
import { PlacePhoto } from "@/components/fragment/place-photo";
import { LandingTemplates } from "@/components/fragment/landing-templates";

const services = [
  { icon: Compass, label: "Jelajahi", href: "/dashboard/explore" },
  { icon: CalendarDays, label: "Itinerary", href: "/dashboard/trips" },
  { icon: Route, label: "Rute", href: "/dashboard/trips" },
  { icon: Wallet, label: "Budget", href: "/dashboard/trips" },
  { icon: Heart, label: "Favorit", href: "/dashboard/favorites" },
  { icon: Share2, label: "Bagikan", href: "/dashboard/trips" },
];

const promos = [
  {
    icon: Route,
    title: "Rute otomatis tiap hari",
    text: "Lihat urutan tempat di peta lengkap dengan jarak dan estimasi waktu tempuh.",
    tone: "from-teal-800 to-emerald-600",
  },
  {
    icon: Wallet,
    title: "Budget tetap terkendali",
    text: "Catat pengeluaran per kategori dan pantau sisa budget dalam Rupiah.",
    tone: "from-amber-600 to-orange-500",
  },
  {
    icon: Share2,
    title: "Bagikan lewat satu tautan",
    text: "Teman dan keluarga bisa melihat rencanamu tanpa perlu membuat akun.",
    tone: "from-sky-700 to-cyan-500",
  },
];

const steps = [
  {
    title: "Pilih tujuan",
    text: "Cari kota atau tempat, lalu lihat wisata, kuliner, dan penginapan di sekitarnya.",
  },
  {
    title: "Susun itinerary",
    text: "Tambahkan tempat ke tiap hari dan atur urutannya dengan drag and drop.",
  },
  {
    title: "Pantau rute dan biaya",
    text: "Cek rute di peta dan catat pengeluaran selama perjalanan.",
  },
  {
    title: "Bagikan",
    text: "Kirim tautan ke teman agar semua tahu rencananya.",
  },
];

export default async function Home() {
  const { actor } = await resolveActor();
  const dashboardHref = actor?.role === "SUPER_ADMIN" ? "/admin" : "/dashboard";

  return (
    <div className="flex flex-1 flex-col bg-neutral-50">
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-teal-800"
          >
            {siteConfig.name}
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-neutral-600 md:flex">
            <a href="#destinasi" className="hover:text-neutral-900">
              Destinasi
            </a>
            <a href="#layanan" className="hover:text-neutral-900">
              Fitur
            </a>
            <a href="#contoh" className="hover:text-neutral-900">
              Contoh
            </a>
            <a href="#faq" className="hover:text-neutral-900">
              FAQ
            </a>
          </nav>
          <Link
            href={actor ? dashboardHref : "/login"}
            className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-900"
          >
            {actor ? "Buka dashboard" : "Masuk"}
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-700">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-28 pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:pb-32 lg:pt-20">
            <div>
              <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-teal-100">
                {siteConfig.tagline}
              </p>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Mau liburan ke mana berikutnya?
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-teal-50/90">
                Temukan destinasi, susun itinerary per hari, lihat rutenya di
                peta, dan atur budget perjalanan, semuanya dalam satu tempat.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-teal-100">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="size-4" /> Masuk dengan Google
                </span>
                <span className="inline-flex items-center gap-2">
                  <Map className="size-4" /> Peta OpenStreetMap
                </span>
                <span className="inline-flex items-center gap-2">
                  <Share2 className="size-4" /> Bagikan lewat tautan
                </span>
              </div>
            </div>

            <div className="relative hidden h-96 lg:block" aria-hidden="true">
              <PlacePhoto
                kind="destination"
                name="Bali"
                className="absolute right-0 top-0 h-56 w-64 rotate-3 rounded-2xl shadow-2xl ring-4 ring-white/80"
                iconClassName="size-10"
              />
              <PlacePhoto
                kind="destination"
                name="Yogyakarta"
                className="absolute left-0 top-24 h-52 w-56 -rotate-3 rounded-2xl shadow-2xl ring-4 ring-white/80"
                iconClassName="size-10"
              />
              <PlacePhoto
                kind="destination"
                name="Raja Ampat"
                className="absolute bottom-0 right-10 h-48 w-60 rotate-1 rounded-2xl shadow-2xl ring-4 ring-white/80"
                iconClassName="size-10"
              />
            </div>
          </div>
        </section>

        <section className="relative z-10 mx-auto -mt-20 max-w-5xl px-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl sm:p-7">
            <form
              action="/dashboard/explore"
              method="get"
              className="flex flex-col gap-3 sm:flex-row"
            >
              <label className="flex flex-1 items-center gap-3 rounded-xl border border-neutral-300 px-4 py-3 focus-within:border-teal-700 focus-within:ring-2 focus-within:ring-teal-100">
                <Search className="size-5 shrink-0 text-teal-800" />
                <span className="sr-only">Cari destinasi</span>
                <input
                  name="q"
                  required
                  placeholder="Cari kota, pantai, atau tempat wisata"
                  className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-neutral-400"
                />
              </label>
              <button
                type="submit"
                className="rounded-xl bg-teal-800 px-8 py-3 text-base font-semibold text-white transition hover:bg-teal-900"
              >
                Cari
              </button>
            </form>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-neutral-500">Populer:</span>
              {QUICK_DESTINATIONS.map((name) => (
                <Link
                  key={name}
                  href={`/dashboard/explore?q=${encodeURIComponent(name)}`}
                  className="rounded-full border border-neutral-200 px-3 py-1 font-medium text-neutral-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-900"
                >
                  {name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section
          id="layanan"
          className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-16"
        >
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {services.map((service) => (
              <Link
                key={service.label}
                href={service.href}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-2 py-5 text-center transition hover:border-teal-300 hover:shadow-md"
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-800 transition group-hover:bg-teal-800 group-hover:text-white">
                  <service.icon className="size-6" />
                </span>
                <span className="text-sm font-medium text-neutral-800">
                  {service.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section
          id="destinasi"
          className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-20"
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
                Destinasi populer
              </h2>
              <p className="mt-1 text-neutral-600">
                Mulai dari tujuan favorit para pejalan di Indonesia.
              </p>
            </div>
            <Link
              href="/dashboard/explore"
              className="hidden items-center gap-1 text-sm font-semibold text-teal-800 hover:underline sm:inline-flex"
            >
              Jelajahi semua <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {POPULAR_DESTINATIONS.map((destination, index) => (
              <Link
                key={destination.name}
                href={`/dashboard/explore?q=${encodeURIComponent(destination.name)}`}
                className={`group relative block overflow-hidden rounded-2xl shadow-sm ${index === 0 ? "col-span-2 row-span-2 h-64 md:h-[26rem]" : "h-44 md:h-[12.5rem]"}`}
              >
                <PlacePhoto
                  kind="destination"
                  name={destination.name}
                  showCredit
                  className="absolute inset-0 transition duration-500 group-hover:scale-105"
                  iconClassName="size-12"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p
                    className={`font-bold text-white ${index === 0 ? "text-2xl" : "text-lg"}`}
                  >
                    {destination.name}
                  </p>
                  <p className="line-clamp-1 text-sm text-white/85">
                    {destination.tagline}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <LandingTemplates />
        <section className="mx-auto max-w-6xl px-4 pt-20">
          <div className="grid gap-4 md:grid-cols-3">
            {promos.map((promo) => (
              <div
                key={promo.title}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${promo.tone} p-6 text-white shadow-sm`}
              >
                <promo.icon className="absolute -bottom-4 -right-4 size-28 text-white/15" />
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-white/20">
                  <promo.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{promo.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/90">
                  {promo.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="contoh"
          className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-20"
        >
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            Seperti ini hasilnya
          </h2>
          <p className="mt-1 text-neutral-600">
            Contoh itinerary buatan sendiri untuk gambaran tampilan. Bukan
            rekomendasi baku.
          </p>

          <div className="mt-8 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 bg-neutral-50 px-5 py-3">
              <p className="font-semibold text-neutral-900">
                {SAMPLE_ITINERARY.title}
              </p>
              <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-900">
                Contoh
              </span>
            </div>
            <div className="grid gap-px bg-neutral-200 md:grid-cols-3">
              {SAMPLE_ITINERARY.days.map((day) => (
                <div key={day.label} className="space-y-4 bg-white p-5">
                  <div>
                    <p className="text-sm font-semibold text-teal-800">
                      {day.label}
                    </p>
                    <p className="text-sm text-neutral-500">{day.theme}</p>
                  </div>
                  <ol className="space-y-3">
                    {day.stops.map((stop) => (
                      <li key={stop.name} className="flex items-center gap-3">
                        <PlacePhoto
                          kind="destination"
                          name={stop.name}
                          className="size-14 shrink-0 rounded-xl"
                          iconClassName="size-5"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-neutral-900">
                            {stop.name}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {stop.time}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-20 border-y border-neutral-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-center text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              Cara kerja
            </h2>
            <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <li key={step.title} className="space-y-3">
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-teal-800 text-base font-bold text-white">
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

        <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20">
          <h2 className="text-center text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            Pertanyaan umum
          </h2>
          <div className="mt-8 divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {FAQ_ITEMS.map((item) => (
              <details key={item.question} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-neutral-900">
                  {item.question}
                  <span className="text-xl leading-none text-teal-800 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24">
          <div className="rounded-3xl bg-gradient-to-br from-teal-900 to-emerald-700 px-6 py-14 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
              Plan Less. Explore More.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-teal-50/90">
              Masuk dengan Google dan buat rencana perjalanan pertamamu hari
              ini.
            </p>
            <Link
              href={actor ? dashboardHref : "/login"}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-base font-semibold text-teal-900 transition hover:bg-teal-50"
            >
              {actor ? "Buka dashboard" : "Mulai rencanakan"}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm text-neutral-600 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <p className="text-lg font-bold text-teal-800">{siteConfig.name}</p>
            <p className="mt-2 max-w-xs">
              {siteConfig.tagline} Workspace perencanaan perjalanan untuk para
              pejalan Indonesia.
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-neutral-900">Jelajahi</p>
            <a href="#destinasi" className="block hover:text-neutral-900">
              Destinasi populer
            </a>
            <a href="#contoh" className="block hover:text-neutral-900">
              Contoh itinerary
            </a>
            <a href="#faq" className="block hover:text-neutral-900">
              FAQ
            </a>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-neutral-900">Sumber data</p>
            <p>Peta: OpenStreetMap · Rute: Geoapify</p>
            <p>Data tempat dan foto: Google Maps</p>
          </div>
        </div>
        <div className="border-t border-neutral-200 py-4 text-center text-xs text-neutral-400">
          © {new Date().getFullYear()} {siteConfig.name}
        </div>
      </footer>
    </div>
  );
}
