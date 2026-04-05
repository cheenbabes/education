import Image from "next/image";
import { ARCHETYPES } from "@/lib/compass/archetypes";

const NO_AUTO_FLIP = new Set(["the-free-spirit", "the-architect", "the-storyteller"]);

const CROP_OFFSET: Record<string, { top?: string; left?: string }> = {
  "the-weaver":    { top: "-30%" },
  "the-architect": { top: "5%", left: "18%" },
};

export function ArchetypeRing({
  archetypes,
  size = 540,
}: {
  archetypes: typeof ARCHETYPES;
  size?: number;
}) {
  const center = size / 2;
  const radius = Math.round(size * (178 / 540));
  const nodeSize = Math.round(size * (112 / 540));
  const compassSize = Math.round(size * (325 / 540));

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      {/* Center compass */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 2 }}>
        <Image
          src="/archetypes/tools/compass.png"
          alt="Compass"
          width={compassSize}
          height={compassSize}
          style={{ objectFit: "contain", display: "block" }}
        />
      </div>

      {/* Character nodes */}
      {archetypes.map((a, i) => {
        const angle = (i / archetypes.length) * 2 * Math.PI - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        const autoFlip = Math.cos(angle) > 0.1 && !NO_AUTO_FLIP.has(a.id);
        const crop = CROP_OFFSET[a.id] ?? {};
        return (
          <div
            key={a.id}
            title={a.name}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: autoFlip ? "translate(-50%, -50%) scaleX(-1)" : "translate(-50%, -50%)",
              width: `${nodeSize}px`,
              height: `${nodeSize}px`,
              borderRadius: "50%",
              overflow: "hidden",
              border: `2px solid ${a.color}`,
              boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
              zIndex: 1,
            }}
          >
            <img
              src={a.imagePath}
              alt={a.name}
              style={{
                position: "absolute",
                width: "100%",
                height: "auto",
                top: crop.top ?? "0%",
                left: crop.left ?? "0%",
              }}
            />
          </div>
        );
      })}

      {/* Dashed ring guide */}
      <svg style={{ position: "absolute", inset: 0, pointerEvents: "none" }} width={size} height={size}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(110,110,158,0.1)"
          strokeWidth="1"
          strokeDasharray="3 8"
        />
      </svg>
    </div>
  );
}
