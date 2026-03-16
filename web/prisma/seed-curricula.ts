import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const prisma = new PrismaClient();

interface CurriculumEntry {
  name: string;
  publisher: string;
  description: string;
  subjects: string[];
  gradeRange: string;
  philosophyScores: Record<string, number>;
  prepLevel: string;
  religiousType: string;
  faithDepth: string;
  priceRange: string;
  qualityScore: number;
  affiliateUrl?: string;
  settingFit: string[];
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
  const curricula: CurriculumEntry[] = JSON.parse(raw);

  console.log(`Found ${curricula.length} curricula to upsert...`);

  let created = 0;
  let updated = 0;

  for (const c of curricula) {
    const existing = await prisma.curriculum.findFirst({
      where: { name: c.name, publisher: c.publisher },
    });

    if (existing) {
      await prisma.curriculum.update({
        where: { id: existing.id },
        data: {
          description: c.description,
          subjects: c.subjects,
          gradeRange: c.gradeRange,
          philosophyScores: c.philosophyScores,
          prepLevel: c.prepLevel,
          religiousType: c.religiousType,
          faithDepth: c.faithDepth,
          priceRange: c.priceRange,
          qualityScore: c.qualityScore,
          affiliateUrl: c.affiliateUrl ?? null,
          settingFit: c.settingFit,
          notes: c.notes ?? null,
          active: c.active ?? true,
        },
      });
      updated++;
    } else {
      await prisma.curriculum.create({
        data: {
          name: c.name,
          publisher: c.publisher,
          description: c.description,
          subjects: c.subjects,
          gradeRange: c.gradeRange,
          philosophyScores: c.philosophyScores,
          prepLevel: c.prepLevel,
          religiousType: c.religiousType,
          faithDepth: c.faithDepth,
          priceRange: c.priceRange,
          qualityScore: c.qualityScore,
          affiliateUrl: c.affiliateUrl ?? null,
          settingFit: c.settingFit,
          notes: c.notes ?? null,
          active: c.active ?? true,
        },
      });
      created++;
    }
  }

  console.log(`Seed complete: ${created} created, ${updated} updated.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
