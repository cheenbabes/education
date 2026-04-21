import { ARCHETYPES } from "@/lib/compass/archetypes";

/**
 * Round avatar that renders an archetype's watercolor portrait inside a circle
 * with a color-matched halo. Framing is per-archetype via `avatarFocus` on the
 * Archetype definition so designers can tune x / y / scale without touching
 * this component.
 *
 * If `archetypeId` is missing or doesn't match a known archetype, renders a
 * neutral initials fallback. Use `size` to control the diameter in px.
 */
export function ArchetypeAvatar({
  archetypeId,
  size = 64,
  ringWidth = 1,
}: {
  archetypeId: string | null | undefined;
  size?: number;
  ringWidth?: number;
}) {
  const def = archetypeId ? ARCHETYPES.find((a) => a.id === archetypeId) : undefined;
  const src = def?.imagePath;
  const color = def?.color || "#82284b";
  const focusX = def?.avatarFocus?.x ?? "50%";
  const focusY = def?.avatarFocus?.y ?? "10%";
  const focusScale = def?.avatarFocus?.scale ?? "180%";

  return (
    <div
      role="img"
      aria-label={def?.name || "Archetype"}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: src
          ? `url(${src}) ${focusX} ${focusY} / ${focusScale} auto no-repeat, radial-gradient(circle at 30% 30%, ${color}22, ${color}08 70%)`
          : `radial-gradient(circle at 30% 30%, ${color}22, ${color}08 70%)`,
        border: `${ringWidth}px solid ${color}33`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
        boxShadow: `0 2px 10px ${color}22`,
      }}
    >
      {!src && archetypeId && (
        <span
          className="font-cormorant-sc"
          style={{ fontSize: `${size * 0.28}px`, fontWeight: 700, color }}
        >
          {archetypeId.replace(/^the-/, "").slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}
