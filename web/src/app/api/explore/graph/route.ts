import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { CurriculumPlacement } from "@/components/explore/types";
import { routeLogger } from "@/lib/logger";

const log = routeLogger("GET /api/explore/graph");

export const dynamic = "force-dynamic";

const KG_URL = process.env.KG_SERVICE_URL || "http://127.0.0.1:8000";

// Philosophy positions on dimension axes (0-100 scale)
// structure: 0=child-led, 100=teacher-directed
// modality: 0=experiential/hands-on, 100=academic/book-based
const PHILOSOPHY_DIMENSIONS: Record<string, { structure: number; modality: number }> = {
  "classical":              { structure: 85, modality: 80 },
  "charlotte-mason":        { structure: 60, modality: 55 },
  "waldorf-adjacent":       { structure: 45, modality: 25 },
  "montessori-inspired":    { structure: 35, modality: 30 },
  "project-based-learning": { structure: 40, modality: 35 },
  "place-nature-based":     { structure: 30, modality: 15 },
  "unschooling":            { structure: 10, modality: 20 },
  "adaptive":               { structure: 50, modality: 50 },
};

const PHILOSOPHY_COLORS: Record<string, string> = {
  "montessori-inspired":    "#8B5CF6",
  "waldorf-adjacent":       "#F59E0B",
  "project-based-learning": "#3B82F6",
  "place-nature-based":     "#10B981",
  "classical":              "#6366F1",
  "charlotte-mason":        "#EC4899",
  "unschooling":            "#F97316",
  "adaptive":               "#6B7280",
};
const CANONICAL_PHILOSOPHIES = Object.keys(PHILOSOPHY_DIMENSIONS);

interface KgPhilosophy {
  name: string;
  description: string;
  principleCount: number;
  activityCount: number;
  materialCount: number;
}

interface KgPrinciple {
  id: string;
  name: string;
  description: string;
  philosophyId: string;
}

interface KgActivity {
  id: string;
  name: string;
  description: string;
  indoorOutdoor: string;
  philosophyId: string;
}

interface KgMaterial {
  id: string;
  name: string;
  category: string;
  philosophyId: string;
}

interface KgData {
  philosophies: KgPhilosophy[];
  principles: KgPrinciple[];
  activities: KgActivity[];
  materials: KgMaterial[];
}

export async function GET() {
  let kgData: KgData = { philosophies: [], principles: [], activities: [], materials: [] };

  try {
    const kgRes = await fetch(`${KG_URL}/graph-export`, {
      cache: "no-store",
    });
    if (kgRes.ok) {
      kgData = await kgRes.json();
    } else {
      log.error({ status: kgRes.status, statusText: kgRes.statusText }, "KG fetch failed");
    }
  } catch (err) {
    log.error({ err }, "KG fetch error");
  }

  // Fetch curricula from Postgres
  const dbCurricula = await prisma.curriculum.findMany({
    where: { active: true },
  });
  const curricula = dbCurricula.map((c) => ({
    id: c.id,
    name: c.name,
    publisher: c.publisher,
    description: c.description,
    subjects: c.subjects,
    gradeRange: c.gradeRange,
    philosophyScores: c.philosophyScores as Record<string, number>,
    prepLevel: c.prepLevel,
    religiousType: c.religiousType,
    priceRange: c.priceRange,
    qualityScore: c.qualityScore,
    affiliateUrl: c.affiliateUrl,
    notes: c.notes,
  }));

  // Generate curriculum placements — one node per philosophy where score ≥ 30%
  const PLACEMENT_THRESHOLD = 0.30;

  // DB stores scores with underscore keys; positions/display use hyphenated canonical names
  const SCORE_KEY_TO_CANONICAL: Record<string, string> = {
    charlotte_mason: "charlotte-mason",
    adaptive: "adaptive",
    eclectic_flexible: "adaptive",
    place_nature: "place-nature-based",
    project_based: "project-based-learning",
    waldorf: "waldorf-adjacent",
    montessori: "montessori-inspired",
    // These match already:
    classical: "classical",
    unschooling: "unschooling",
  };

  const curriculumPlacements: CurriculumPlacement[] = [];
  for (const c of curricula) {
    const scores = c.philosophyScores as Record<string, number>;
    for (const [philName, score] of Object.entries(scores)) {
      const canonicalName = SCORE_KEY_TO_CANONICAL[philName] ?? philName;
      if (score >= PLACEMENT_THRESHOLD && canonicalName !== "adaptive") {
        curriculumPlacements.push({
          placementId: `${c.id}__${canonicalName}`,
          curriculumId: c.id,
          philosophyName: canonicalName,
          score,
          name: c.name,
          publisher: c.publisher,
          description: c.description,
          subjects: c.subjects,
          gradeRange: c.gradeRange,
          philosophyScores: scores,
          prepLevel: c.prepLevel,
          religiousType: c.religiousType,
          priceRange: c.priceRange,
          qualityScore: c.qualityScore,
          affiliateUrl: c.affiliateUrl,
          notes: c.notes,
        });
      }
    }
  }

  // Build philosophy nodes with dimensions and colors, deduplicated by name.
  const philosophyMap = new Map<string, KgPhilosophy>();
  for (const p of kgData.philosophies) {
    const existing = philosophyMap.get(p.name);
    if (!existing) {
      philosophyMap.set(p.name, p);
      continue;
    }
    philosophyMap.set(p.name, {
      ...existing,
      description: existing.description || p.description,
      principleCount: Math.max(existing.principleCount || 0, p.principleCount || 0),
      activityCount: Math.max(existing.activityCount || 0, p.activityCount || 0),
      materialCount: Math.max(existing.materialCount || 0, p.materialCount || 0),
    });
  }

  // Normalize legacy philosophy names from KG service
  const LEGACY_PHILOSOPHY_NAMES: Record<string, string> = {
    flexible: "adaptive",
    eclectic: "adaptive",
  };

  const philosophies = Array.from(philosophyMap.values()).map((p) => {
    const name = LEGACY_PHILOSOPHY_NAMES[p.name] || p.name;
    return {
      ...p,
      name,
      dimensions: PHILOSOPHY_DIMENSIONS[name] || { structure: 50, modality: 50 },
      color: PHILOSOPHY_COLORS[name] || "#6B7280",
    };
  });

  const presentPhilosophies = new Set(philosophies.map((p) => p.name));
  const missingPhilosophies = CANONICAL_PHILOSOPHIES.filter(
    (name) => !presentPhilosophies.has(name),
  );

  return NextResponse.json(
    {
      philosophies,
      curricula,
      curriculumPlacements,
      principles: kgData.principles,
      activities: kgData.activities,
      materials: kgData.materials,
      dataIntegrity: {
        missingPhilosophies,
      },
    },
    {
      headers: { "Cache-Control": "no-cache" },
    },
  );
}
