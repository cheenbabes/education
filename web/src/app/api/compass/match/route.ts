import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  matchCurricula,
  type PhilosophyBlend,
  type Part2Preferences,
  type CurriculumRecord,
} from "@/lib/compass/matching";

// POST /api/compass/match — run curriculum matching algorithm
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { compassResultId, philosophyBlend, part2Preferences, debug } = body;

  let blend: PhilosophyBlend;
  let prefs: Part2Preferences;

  if (compassResultId) {
    // Load from stored compass result
    const result = await prisma.compassResult.findUnique({
      where: { id: compassResultId },
    });
    if (!result) {
      return NextResponse.json({ error: "Compass result not found" }, { status: 404 });
    }
    blend = result.philosophyBlend as PhilosophyBlend;
    prefs = result.part2Preferences as Part2Preferences;
  } else if (philosophyBlend) {
    blend = philosophyBlend;
    prefs = part2Preferences ?? {};
  } else {
    return NextResponse.json(
      { error: "Provide either compassResultId or philosophyBlend" },
      { status: 400 },
    );
  }

  // Fetch all active curricula
  const dbCurricula = await prisma.curriculum.findMany({
    where: { active: true },
  });

  // Map to the matching algorithm's input type
  const curricula: CurriculumRecord[] = dbCurricula.map((c) => ({
    id: c.id,
    name: c.name,
    publisher: c.publisher,
    description: c.description,
    subjects: c.subjects,
    gradeRange: c.gradeRange,
    philosophyScores: c.philosophyScores as Record<string, number>,
    prepLevel: c.prepLevel,
    religiousType: c.religiousType,
    faithDepth: c.faithDepth,
    priceRange: c.priceRange,
    qualityScore: c.qualityScore,
    affiliateUrl: c.affiliateUrl,
    settingFit: c.settingFit,
    notes: c.notes,
  }));

  const matchOutput = matchCurricula(blend, prefs, curricula, !!debug);

  return NextResponse.json(matchOutput);
}
