export type NavItem = {
  label: string;
  href: string;
  icon: string;
};

export const userNavigation: NavItem[] = [
  { label: "Beranda", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Perjalanan", href: "/dashboard/trips", icon: "Briefcase" },
  { label: "Jelajahi", href: "/dashboard/explore", icon: "Compass" },
  { label: "Favorit", href: "/dashboard/favorites", icon: "Heart" },
  { label: "Pengaturan", href: "/dashboard/settings", icon: "Settings" },
];

export const adminNavigation: NavItem[] = [
  { label: "Ringkasan", href: "/admin", icon: "LayoutDashboard" },
  { label: "Pengguna", href: "/admin/users", icon: "Users" },
  { label: "Perjalanan", href: "/admin/trips", icon: "Briefcase" },
  { label: "Aktivitas", href: "/admin/activity", icon: "Activity" },
  { label: "Pengaturan", href: "/admin/settings", icon: "Settings" },
];
