export const siteConfig = {
  name: "SNU Chennai Placement Dashboard",
  description:
    "Placement statistics and analytics dashboard for Shiv Nadar University Chennai — Batch 2022-26. Track CTC, companies, offers, and student placement outcomes.",
  shortDescription:
    "Placement tracking and analytics for Shiv Nadar University Chennai — Batch 2022-26.",
  batch: "2022-26",
  url: "https://placement-dashboard-nu.vercel.app",
  ogImage: "/opengraph-image",
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
  { label: "Drives", href: "/dashboard/drives", adminOnly: true },
  { label: "Export", href: "/dashboard/export", adminOnly: true },
];
