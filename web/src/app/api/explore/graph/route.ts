import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const KG_URL = process.env.NEXT_PUBLIC_KG_SERVICE_URL || "http://localhost:8000";

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
  "flexible":               { structure: 50, modality: 50 },
};

const PHILOSOPHY_COLORS: Record<string, string> = {
  "montessori-inspired":    "#8B5CF6",
  "waldorf-adjacent":       "#F59E0B",
  "project-based-learning": "#3B82F6",
  "place-nature-based":     "#10B981",
  "classical":              "#6366F1",
  "charlotte-mason":        "#EC4899",
  "unschooling":            "#F97316",
  "flexible":               "#6B7280",
};

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
      next: { revalidate: 3600 },
    });
    if (kgRes.ok) {
      kgData = await kgRes.json();
    }
  } catch {
    // KG service not running — serve what we can from Postgres
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

  // Build philosophy nodes with dimensions and colors
  const philosophies = kgData.philosophies.map((p: KgPhilosophy) => ({
    ...p,
    dimensions: PHILOSOPHY_DIMENSIONS[p.name] || { structure: 50, modality: 50 },
    color: PHILOSOPHY_COLORS[p.name] || "#6B7280",
  }));

  return NextResponse.json(
    {
      philosophies,
      curricula,
      principles: kgData.principles,
      activities: kgData.activities,
      materials: kgData.materials,
    },
    {
      headers: { "Cache-Control": "public, max-age=3600" },
    },
  );
}
