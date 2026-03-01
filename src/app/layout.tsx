import type { Metadata } from "next";
import { poppins, inter, ibmPlexMono } from "@/lib/fonts";
import { SessionProvider } from "@/providers/session-provider";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SNU Chennai Placement Dashboard",
  description:
    "Placement tracking and analytics dashboard for Shiv Nadar University Chennai — Batch 2022-26",
  icons: {
    icon: "/logo_blue.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${inter.variable} ${ibmPlexMono.variable} antialiased`}
      >
        <SessionProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </SessionProvider>
        <Toaster richColors position="top-right" />
        <Analytics />
      </body>
    </html>
  );
}
