import Link from "next/link";
import { NavLinks } from "@/components/fragment/nav-links";
import { SignOutButton } from "@/components/fragment/sign-out-button";

type AppHeaderProps = {
  brand: string;
  homeHref: string;
  links: { label: string; href: string; exact?: boolean }[];
  userLabel: string;
};

export function AppHeader({ brand, homeHref, links, userLabel }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Link href={homeHref} className="font-semibold tracking-tight text-teal-900">
            {brand}
          </Link>
          <NavLinks items={links} />
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden max-w-48 truncate text-sm text-neutral-600 sm:block">{userLabel}</span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}