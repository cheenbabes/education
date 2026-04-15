import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { ARCHETYPES } from "@/lib/compass/archetypes";
import { getComboText } from "@/lib/compass/combo-text";
import { SITE_ORIGIN } from "@/lib/site";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const archetypeId = searchParams.get("a");
  const secondaryId = searchParams.get("s");

  const archetype = ARCHETYPES.find((a) => a.id === archetypeId);
  if (!archetype) {
    return new Response("Archetype not found", { status: 404 });
  }

  const secondary = secondaryId
    ? ARCHETYPES.find((a) => a.id === secondaryId) ?? null
    : null;

  const combo = secondary ? getComboText(archetypeId!, secondaryId!) : null;
  const subtitle = secondary ? `with ${secondary.name} tendencies` : null;
  const description = combo?.shareText ?? archetype.description.split(".")[0] + ".";

  const avatarUrl = `${SITE_ORIGIN}${archetype.resultsImagePath}`;
  const toolUrl = secondary ? `${SITE_ORIGIN}${secondary.toolPath}` : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200",
          height: "630",
          display: "flex",
          background: "linear-gradient(135deg, #E8E4F0 0%, #D4DCE8 50%, #E0E8E4 100%)",
          fontFamily: "serif",
          position: "relative",
        }}
      >
        {/* Left side — avatar + tool */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            width: "420",
            height: "630",
            paddingBottom: "40",
            paddingLeft: "40",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl}
            alt=""
            width="300"
            height="300"
            style={{ objectFit: "contain" }}
          />
          {toolUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={toolUrl}
              alt=""
              width="150"
              height="150"
              style={{ objectFit: "contain", opacity: 0.7, marginLeft: "-20px" }}
            />
          )}
        </div>

        {/* Right side — text */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            padding: "60px 60px 60px 20px",
          }}
        >
          <div
            style={{
              fontSize: "16",
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#6B7280",
              marginBottom: "12",
            }}
          >
            Sage&apos;s Compass
          </div>
          <div
            style={{
              fontSize: "48",
              fontWeight: 700,
              color: archetype.color,
              lineHeight: 1.1,
              marginBottom: "8",
            }}
          >
            {archetype.name}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: "22",
                color: secondary?.color ?? "#6B7280",
                marginBottom: "20",
              }}
            >
              {subtitle}
            </div>
          )}
          <div
            style={{
              fontSize: "18",
              color: "#4B5563",
              lineHeight: 1.5,
              maxWidth: "500",
            }}
          >
            {description.length > 180 ? description.slice(0, 177) + "..." : description}
          </div>
          <div
            style={{
              marginTop: "24",
              fontSize: "14",
              color: "#9CA3AF",
            }}
          >
            sagescompass.com
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
