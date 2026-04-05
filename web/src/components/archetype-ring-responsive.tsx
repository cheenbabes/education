"use client";

import { useState, useEffect } from "react";
import { ARCHETYPES } from "@/lib/compass/archetypes";
import { ArchetypeRing } from "./archetype-ring";

export function ArchetypeRingResponsive({ archetypes }: { archetypes: typeof ARCHETYPES }) {
  const [size, setSize] = useState(540);

  useEffect(() => {
    function update() {
      setSize(window.innerWidth < 768 ? 320 : 540);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return <ArchetypeRing archetypes={archetypes} size={size} />;
}
