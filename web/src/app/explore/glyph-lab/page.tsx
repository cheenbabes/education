"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { PHILOSOPHY_PLANET_SIGNS } from "@/components/explore/glyphs";

const STAR_PACK = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  src: `/explore/curated-pack/glyph-${String(i + 1).padStart(2, "0")}.png`,
  tier: i < 4 ? "Philosophy anchor" : i < 8 ? "Curriculum marker" : "Detail marker",
  label: `Variant ${i + 1}`,
}));

type GlyphLabItem = {
  id: number;
  src: string;
  tier: string;
  label: string;
  key?: string;
};

const SEMANTIC_PACK: GlyphLabItem[] = [
  { id: 1, src: "/explore/constellation-philosophy/classical.png", tier: "Philosophy", label: "Classical - Orion", key: "classical" },
  { id: 2, src: "/explore/constellation-philosophy/charlotte-mason.png", tier: "Philosophy", label: "Charlotte Mason - Cassiopeia", key: "charlotte-mason" },
  { id: 3, src: "/explore/constellation-philosophy/waldorf-adjacent.png", tier: "Philosophy", label: "Waldorf - Cygnus", key: "waldorf-adjacent" },
  { id: 4, src: "/explore/constellation-philosophy/montessori-inspired.png", tier: "Philosophy", label: "Montessori - Crux", key: "montessori-inspired" },
  { id: 5, src: "/explore/constellation-philosophy/project-based-learning.png", tier: "Philosophy", label: "Project-Based - Scorpius", key: "project-based-learning" },
  { id: 6, src: "/explore/constellation-philosophy/place-nature-based.png", tier: "Philosophy", label: "Place/Nature - Ursa Major", key: "place-nature-based" },
  { id: 7, src: "/explore/constellation-philosophy/unschooling.png", tier: "Philosophy", label: "Unschooling - Pegasus", key: "unschooling" },
  { id: 8, src: "/explore/constellation-philosophy/adaptive.png", tier: "Philosophy", label: "Adaptive - Leo", key: "adaptive" },
  { id: 9, src: "/explore/semantic-glyphs/curriculum-structured.png", tier: "Curriculum", label: "Structured Curriculum" },
  { id: 10, src: "/explore/semantic-glyphs/curriculum-creative.png", tier: "Curriculum", label: "Creative Curriculum" },
  { id: 11, src: "/explore/semantic-glyphs/curriculum-explorer.png", tier: "Curriculum", label: "Explorer Curriculum" },
  { id: 12, src: "/explore/semantic-glyphs/philosophy-focused-overlay.png", tier: "Focus State", label: "Focused Overlay" },
];

const BASE_PACK: GlyphLabItem[] = [
  { id: 1, src: "/explore/glyphs/philosophy-major.png", tier: "Philosophy", label: "Current Philosophy" },
  { id: 2, src: "/explore/glyphs/philosophy-focused.png", tier: "Philosophy", label: "Current Focused" },
  { id: 3, src: "/explore/glyphs/curriculum-node.png", tier: "Curriculum", label: "Current Curriculum" },
  { id: 4, src: "/explore/glyphs/detail-principle.png", tier: "Detail", label: "Principle Detail" },
  { id: 5, src: "/explore/glyphs/detail-activity.png", tier: "Detail", label: "Activity Detail" },
  { id: 6, src: "/explore/glyphs/detail-material.png", tier: "Detail", label: "Material Detail" },
];

type PackId = "semantic" | "atlas-stars" | "current";

export default function GlyphLabPage() {
  const [pack, setPack] = useState<PackId>("semantic");
  const glyphs: GlyphLabItem[] = useMemo(() => {
    if (pack === "atlas-stars") return STAR_PACK;
    if (pack === "current") return BASE_PACK;
    return SEMANTIC_PACK;
  }, [pack]);

  return (
    <main className="min-h-screen w-full bg-[#070913] text-[#f0d8a1] relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-80 bg-cover bg-center"
        style={{ backgroundImage: "url('/explore/watercolor-bg-teal.png')" }}
      />
      <div className="pointer-events-none absolute inset-0 opacity-35 bg-[url('/explore/watercolor-grain.svg')] mix-blend-soft-light" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[11px] tracking-[0.18em] uppercase text-[#d4af37]/70">Explore / Glyph Lab</p>
            <h1
              className="text-4xl mt-2 tracking-[0.04em]"
              style={{ fontFamily: '"IM Fell English SC", ui-serif, Georgia, serif' }}
            >
              Curated Atlas Glyph Pack
            </h1>
            <p className="text-sm mt-3 text-[#f6e4bc]/80 max-w-3xl">
              Compare three packs: semantic philosophy glyphs (recommended), star-atlas ornamental variants, and current live glyphs.
            </p>
          </div>
          <Link
            href="/explore"
            className="px-3 py-1.5 rounded border border-[#d4af37]/45 text-[#f2deab] hover:bg-[#d4af37]/10 text-sm"
          >
            Back to Explore
          </Link>
        </div>

        <section className="mb-5 flex flex-wrap gap-2">
          {[
            { id: "semantic", label: "Pack A - Semantic (Recommended)" },
            { id: "atlas-stars", label: "Pack B - Atlas Star Variants" },
            { id: "current", label: "Pack C - Current Live" },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setPack(option.id as PackId)}
              className={`px-3 py-1.5 rounded border text-xs tracking-[0.12em] uppercase transition-colors ${
                pack === option.id
                  ? "border-[#d4af37]/70 bg-[#d4af37]/15 text-[#f3dfae]"
                  : "border-[#d4af37]/30 bg-black/30 text-[#d4af37]/70 hover:bg-[#d4af37]/10"
              }`}
            >
              {option.label}
            </button>
          ))}
        </section>

        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {glyphs.map((glyph) => (
            <div
              key={glyph.id}
              className="rounded-lg border border-[#d4af37]/24 bg-black/35 backdrop-blur-sm p-4"
            >
              <div className="h-28 rounded-md bg-black/35 flex items-center justify-center">
                <Image
                  src={glyph.src}
                  alt={`Glyph ${glyph.id}`}
                  width={80}
                  height={80}
                  className="w-20 h-20 object-contain"
                />
              </div>
              <p className="mt-3 text-[11px] tracking-[0.14em] uppercase text-[#d4af37]/65">{glyph.tier}</p>
              <p className="text-sm text-[#f4e1b4]">{glyph.label}</p>
              {glyph.key ? (
                <p className="text-xl text-[#f7e7bf] mt-1" style={{ fontFamily: '"STIX Two Text", serif' }}>
                  {PHILOSOPHY_PLANET_SIGNS[glyph.key]}
                </p>
              ) : null}
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-lg border border-[#d4af37]/24 bg-black/35 backdrop-blur-sm p-5">
          <p className="text-[11px] tracking-[0.18em] uppercase text-[#d4af37]/65">Planet Mapping (Pack A)</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-3 text-sm text-[#edd8a8]">
            <p>Classical - ♄ Saturn</p>
            <p>Charlotte Mason - ☿ Mercury</p>
            <p>Waldorf - ♆ Neptune</p>
            <p>Montessori - ♁ Earth</p>
            <p>Project-Based - ♂ Mars</p>
            <p>Place/Nature - ♀ Venus</p>
            <p>Unschooling - ♅ Uranus</p>
            <p>Adaptive - ♃ Jupiter</p>
          </div>
          <p className="mt-3 text-[11px] text-[#d4af37]/65">
            Source:{" "}
            <a
              href="https://zenodo.org/doi/10.5281/zenodo.10397192"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-[#d4af37]/40 hover:text-[#d4af37]/90"
            >
              ConstellationLines by Marc van der Sluys (CC BY 4.0)
            </a>
          </p>
        </section>

        <section className="mt-8 rounded-lg border border-[#d4af37]/24 bg-black/35 backdrop-blur-sm p-5">
          <p className="text-[11px] tracking-[0.18em] uppercase text-[#d4af37]/65">Font Pairing Preview</p>
          <p className="mt-3 text-3xl text-[#f2ddab]" style={{ fontFamily: '"IM Fell English SC", ui-serif, Georgia, serif' }}>
            Philosophy Labels - IM Fell English SC
          </p>
          <p className="mt-2 text-2xl text-[#ead3a0]" style={{ fontFamily: '"Cormorant SC", ui-serif, Georgia, serif' }}>
            Curriculum Labels - Cormorant SC Semibold
          </p>
        </section>
      </div>
    </main>
  );
}

