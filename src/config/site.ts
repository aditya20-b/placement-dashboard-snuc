export const siteConfig = {
  name: "SNU Chennai Placement Dashboard",
  description:
    "Placement tracking and analytics dashboard for Shiv Nadar University Chennai",
  batch: "2021-25",
} as const;

export interface NavItem {
  label: string;
  href: string;
  adminOnly: boolean;
}

export const navItems: NavItem[] = [
  { label: "Overview", href: "/dashboard", adminOnly: false },
  { label: "CTC Analytics", href: "/dashboard/ctc", adminOnly: false },
  { label: "Companies", href: "/dashboard/companies", adminOnly: false },
  { label: "Students", href: "/dashboard/students", adminOnly: true },
  { label: "Export", href: "/dashboard/export", adminOnly: true },
];
