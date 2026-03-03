import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";
export const alt = "SNU Chennai Placement Dashboard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  const logoData = readFileSync(join(process.cwd(), "public/snu-logo.png"));
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #E6F0F9 0%, #ffffff 50%, #FDF6E0 100%)",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "linear-gradient(90deg, #0056A2 0%, #3387CF 60%, #D4A516 100%)",
          }}
        />

        {/* Bottom accent bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "linear-gradient(90deg, #0056A2 0%, #3387CF 60%, #D4A516 100%)",
          }}
        />

        {/* Subtle decorative circle — top right */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(0, 86, 162, 0.07)",
          }}
        />

        {/* Subtle decorative circle — bottom left */}
        <div
          style={{
            position: "absolute",
            bottom: -100,
            left: -100,
            width: 350,
            height: 350,
            borderRadius: "50%",
            background: "rgba(212, 165, 22, 0.08)",
          }}
        />

        {/* Top-left logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          alt="Shiv Nadar University Chennai"
          width={260}
          height={80}
          style={{
            position: "absolute",
            top: 48,
            left: 64,
            objectFit: "contain",
            objectPosition: "left center",
          }}
        />

        {/* Main heading */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#0056A2",
            letterSpacing: -1.5,
            textAlign: "center",
            lineHeight: 1.1,
            marginBottom: 24,
          }}
        >
          Placement Dashboard
        </div>

        {/* Divider */}
        <div
          style={{
            width: 80,
            height: 4,
            borderRadius: 2,
            background: "#D4A516",
            marginBottom: 28,
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: "#495057",
            textAlign: "center",
            fontWeight: 400,
          }}
        >
          Batch 2022–26 · Placement Statistics &amp; Analytics
        </div>
      </div>
    ),
    { ...size }
  );
}
