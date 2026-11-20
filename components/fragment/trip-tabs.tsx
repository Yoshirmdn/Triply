"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type TripTabsProps = {
  tripId: string;
};

export function TripTabs({ tripId }: TripTabsProps) {
  const pathname = usePathname();
  const base = `/dashboard/trips/${tripId}`;
  const tabs = [
    { label: "Ringkasan", href: base, exact: true },
    { label: "Planner", href: `${base}/planner` },
    { label: "Peta", href: `${base}/map` },
    { label: "Budget", href: `${base}/budget` },
    { label: "Checklist", href: `${base}/checklist` },
    { label: "Catatan", href: `${base}/notes` },
  ];

  return (
    <nav className="-mx-4 mb-6 overflow-x-auto border-b border-neutral-200 px-4 print:hidden">
      <ul className="flex min-w-max gap-1">
        {tabs.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={cn(
                  "-mb-px inline-block border-b-2 px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "border-teal-800 text-teal-900"
                    : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-900",
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
