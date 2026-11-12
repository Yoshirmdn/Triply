import { requirePageRole } from "@/lib/permissions";
import { siteConfig } from "@/data/site";
import { AppHeader } from "@/components/fragment/app-header";

const links = [
  { label: "Ringkasan", href: "/admin", exact: true },
  { label: "Pengguna", href: "/admin/users" },
  { label: "Perjalanan", href: "/admin/trips" },
  { label: "Aktivitas", href: "/admin/activity" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const actor = await requirePageRole("SUPER_ADMIN");

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader
        brand={`${siteConfig.name} Admin`}
        homeHref="/admin"
        links={links}
        userLabel={actor.name ?? actor.email}
      />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}