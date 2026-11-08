import { redirect } from "next/navigation";
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

function safeRedirectPath(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/login";
  return value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, callbackUrl } = await searchParams;
  const { actor } = await resolveActor();
  if (actor) redirect(homePathForRole(actor.role));

  const redirectTo = safeRedirectPath(callbackUrl);
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? "Login gagal. Coba lagi.") : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-teal-900">{siteConfig.name}</h1>
          <p className="mt-1 text-sm text-neutral-500">{siteConfig.tagline}</p>
        </div>

        {errorMessage ? (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
        ) : null}

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-lg bg-teal-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-900"
          >
            Lanjutkan dengan Google
          </button>
        </form>
      </div>
    </main>
  );
}