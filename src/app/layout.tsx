import type { Metadata, Viewport } from "next";
import { poppins, inter, ibmPlexMono } from "@/lib/fonts";
import { SessionProvider } from "@/providers/session-provider";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import { siteConfig } from "@/config/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "SNU Chennai",
    "Shiv Nadar University Chennai",
    "placement dashboard",
    "placement statistics",
    "campus placements",
    "CTC analytics",
    "batch 2022-26",
    "placement tracker",
  ],
  authors: [{ name: "Shiv Nadar University Chennai" }],
  creator: "Shiv Nadar University Chennai",
  publisher: "Shiv Nadar University Chennai",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.shortDescription,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: "SNU Chennai Placement Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.shortDescription,
    images: [siteConfig.ogImage],
    creator: "@snuchennai",
    site: "@snuchennai",
  },
  icons: {
    icon: [
      { url: "/logo_blue.png", type: "image/png" },
    ],
    apple: "/logo_blue.png",
    shortcut: "/logo_blue.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteConfig.url}/#website`,
      url: siteConfig.url,
      name: siteConfig.name,
      description: siteConfig.description,
      publisher: { "@id": `${siteConfig.url}/#organization` },
    },
    {
      "@type": "EducationalOrganization",
      "@id": `${siteConfig.url}/#organization`,
      name: "Shiv Nadar University Chennai",
      url: siteConfig.url,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}/logo_blue.png`,
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
