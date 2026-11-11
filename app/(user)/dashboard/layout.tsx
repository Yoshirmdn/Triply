import { requirePageUser } from "@/lib/permissions";
import { siteConfig } from "@/data/site";
import { AppHeader } from "@/components/fragment/app-header";

const links = [
  { label: "Beranda", href: "/dashboard", exact: true },
  { label: "Perjalanan", href: "/dashboard/trips" },
  { label: "Jelajahi", href: "/dashboard/explore" },
  { label: "Favorit", href: "/dashboard/favorites" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await requirePageUser();

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader
        brand={siteConfig.name}
        homeHref="/dashboard"
        links={links}
        userLabel={actor.name ?? actor.email}
      />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
