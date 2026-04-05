import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const alt = "The Sage's Compass — Homeschool Curriculum for Your Family";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  const compassData = await readFile(
    join(process.cwd(), "public/archetypes/tools/compass.png")
  );
  const compassSrc = `data:image/png;base64,${compassData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f9f6ef 0%, #ede8dc 60%, #e0d9c8 100%)",
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        {/* Subtle texture overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 30% 50%, rgba(196,152,61,0.08) 0%, transparent 60%)",
          display: "flex",
        }} />

        {/* Compass */}
        <div style={{ display: "flex", alignItems: "center", gap: 72 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={compassSrc}
            width={280}
            height={268}
            style={{ objectFit: "contain" }}
            alt=""
          />

          {/* Text */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{
              display: "flex",
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#8b6914",
            }}>
              Homeschool · Curriculum · Archetypes
            </div>
            <div style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: "0.03em",
              color: "#1a1208",
              lineHeight: 1.1,
            }}>
              The Sage&apos;s Compass
            </div>
            <div style={{
              display: "flex",
              fontSize: 22,
              color: "#5c4a2a",
              lineHeight: 1.5,
              maxWidth: 520,
            }}>
              Discover your teaching archetype. Create lessons matched to your philosophy, your child, and your state&apos;s standards.
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
