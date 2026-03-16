import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const prisma = new PrismaClient();

// JSON uses snake_case, Prisma uses camelCase
interface RawCurriculum {
  name: string;
  publisher: string;
  description: string;
  subjects: string[];
  grade_range: string;
  philosophy_scores: Record<string, number>;
  prep_level: string;
  religious_type: string;
  faith_depth: string;
  price_range: string;
  quality_score: number;
  affiliate_url?: string;
  setting_fit: string[];
  notes?: string;
  active?: boolean;
}

const JSON_PATH = resolve(__dirname, "../../docs/curriculum-research/all-curricula.json");

async function main() {
  if (!existsSync(JSON_PATH)) {
    console.log(`Curricula JSON not found at ${JSON_PATH} — skipping seed.`);
    return;
  }

  const raw = readFileSync(JSON_PATH, "utf-8");
  const curricula: RawCurriculum[] = JSON.parse(raw);

  console.log(`Found ${curricula.length} curricula to upsert...`);

  let created = 0;
  let updated = 0;

  for (const c of curricula) {
    const data = {
      name: c.name,
      publisher: c.publisher,
      description: c.description,
      subjects: c.subjects,
      gradeRange: c.grade_range,
      philosophyScores: c.philosophy_scores as any,
      prepLevel: c.prep_level,
      religiousType: c.religious_type,
      faithDepth: c.faith_depth,
      priceRange: c.price_range,
      qualityScore: c.quality_score,
      affiliateUrl: c.affiliate_url || null,
      settingFit: c.setting_fit,
      notes: c.notes || null,
      active: c.active ?? true,
    };

    const existing = await prisma.curriculum.findFirst({
      where: { name: c.name, publisher: c.publisher },
    });

    if (existing) {
      await prisma.curriculum.update({
        where: { id: existing.id },
        data,
      });
      updated++;
    } else {
      await prisma.curriculum.create({ data });
      created++;
    }
  }

  console.log(`Seed complete: ${created} created, ${updated} updated.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
