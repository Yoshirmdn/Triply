import { redirect } from "next/navigation";
import {
  ArrowRight,
  CircleAlert,
  LayoutDashboard,
  Lock,
  ShieldCheck,
  Users,
} from "lucide-react";
import { signIn } from "@/lib/auth";
import { homePathForRole, resolveActor } from "@/lib/permissions";
import { siteConfig } from "@/data/site";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
};

const ERROR_MESSAGES: Record<string, string> = {
  inactive: "Akunmu dinonaktifkan. Hubungi administrator.",
  AccessDenied: "Akses ditolak. Akunmu mungkin dinonaktifkan.",
  OAuthAccountNotLinked: "Email ini sudah terhubung dengan metode login lain.",
  Configuration: "Konfigurasi login bermasalah. Coba lagi nanti.",
};

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Dashboard terpusat",
    desc: "Semua data dan aktivitas dalam satu tampilan.",
  },
  {
    icon: Users,
    title: "Akses sesuai peran",
    desc: "Setiap pengguna hanya melihat yang menjadi haknya.",
  },
  {
    icon: ShieldCheck,
    title: "Login aman",
    desc: "Autentikasi lewat akun Google, tanpa password tambahan.",
  },
];

function safeRedirectPath(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//"))
    return "/login";
  return value;
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.28-2.1 3.54-5.19 3.54-8.87Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56V6.63H1.27a12 12 0 0 0 0 10.74l4-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.63l4 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, callbackUrl } = await searchParams;
  const { actor } = await resolveActor();
  if (actor) redirect(homePathForRole(actor.role));

  const redirectTo = safeRedirectPath(callbackUrl);
  const errorMessage = error
    ? (ERROR_MESSAGES[error] ?? "Login gagal. Coba lagi.")
    : null;
  const initial = siteConfig.name.charAt(0).toUpperCase();

  return (
    <main className="grid min-h-screen bg-neutral-50 lg:grid-cols-[1.1fr_1fr]">
      {/* Panel brand (desktop only) */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-teal-950 via-teal-900 to-teal-800 lg:flex lg:flex-col lg:justify-between lg:p-14">
        {/* Grid pattern */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage:
              "radial-gradient(ellipse at center, black 40%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          }}
        />
        {/* Glow */}
        <div
          aria-hidden="true"
          className="absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-teal-500/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-emerald-400/15 blur-3xl"
        />

        {/* Brand */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-lg font-bold text-white ring-1 ring-white/25 backdrop-blur">
            {initial}
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">
            {siteConfig.name}
          </span>
        </div>

        {/* Headline + features */}
        <div className="relative max-w-lg">
          <h2 className="text-4xl font-semibold leading-[1.15] tracking-tight text-white xl:text-5xl">
            {siteConfig.tagline}
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-teal-100/75">
            Masuk untuk mengakses dashboard dan mengelola semuanya dalam satu
            tempat.
          </p>

          <ul className="mt-10 space-y-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-teal-100 ring-1 ring-white/15">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{title}</p>
                  <p className="mt-0.5 text-sm text-teal-100/65">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-teal-100/50">
          &copy; {new Date().getFullYear()} {siteConfig.name}. All rights
          reserved.
        </p>
      </aside>

      {/* Panel form */}
      <section className="relative flex items-center justify-center px-6 py-12 sm:px-10">
        {/* Subtle background di mobile */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-teal-50 to-transparent lg:hidden"
        />

        <div className="relative w-full max-w-md">
          {/* Logo (mobile only) */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-900 text-lg font-bold text-white shadow-sm">
              {initial}
            </div>
            <span className="text-lg font-semibold tracking-tight text-teal-950">
              {siteConfig.name}
            </span>
          </div>

          <div className="rounded-3xl border border-neutral-200/80 bg-white p-8 shadow-xl shadow-teal-900/5 sm:p-10">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-800 ring-1 ring-teal-100">
                <Lock className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                Masuk ke akunmu
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                Gunakan akun Google yang terdaftar untuk melanjutkan.
              </p>
            </div>

            {/* Error */}
            {errorMessage ? (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            ) : null}

            {/* Google button */}
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo });
              }}
            >
              <button
                type="submit"
                className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-300 bg-white px-5 py-3.5 text-sm font-medium text-neutral-800 shadow-sm transition-all hover:border-teal-700/40 hover:bg-neutral-50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 active:scale-[0.99]"
              >
                <GoogleIcon className="h-5 w-5" />
                <span>Lanjutkan dengan Google</span>
                <ArrowRight
                  className="absolute right-4 h-4 w-4 -translate-x-1 text-neutral-400 opacity-0 transition-all group-hover:translate-x-0 group-hover:text-teal-700 group-hover:opacity-100"
                  strokeWidth={2}
                />
              </button>
            </form>

            {/* Divider */}
            <div className="my-7 flex items-center gap-3">
              <div className="h-px flex-1 bg-neutral-200" />
              <span className="text-[11px] font-medium uppercase tracking-widest text-neutral-400">
                Akses terbatas
              </span>
              <div className="h-px flex-1 bg-neutral-200" />
            </div>

            {/* Info */}
            <div className="flex items-start gap-3 rounded-xl bg-neutral-50 px-4 py-3.5 ring-1 ring-neutral-200/70">
              <ShieldCheck
                className="mt-0.5 h-4 w-4 shrink-0 text-teal-700"
                strokeWidth={1.75}
              />
              <p className="text-xs leading-relaxed text-neutral-500">
                Hanya akun yang terdaftar dan aktif yang bisa masuk. Belum punya
                akses? Hubungi administrator.
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-neutral-400 lg:hidden">
            &copy; {new Date().getFullYear()} {siteConfig.name}
          </p>
        </div>
      </section>
    </main>
  );
}
