import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BLEND_KEY_TO_PHILOSOPHY_ID } from "@/lib/archetype-utils";

export const dynamic = "force-dynamic";

/**
 * Post-sign-in / post-sign-up smart redirect.
 *
 * Routes users to the page that's actually useful for them right now,
 * based on what they have (not what tier they're on):
 *
 *   - No CompassResult          → /compass        (take the quiz first)
 *   - Has Compass, no Lessons   → /create?philosophy={top} (make your first lesson)
 *   - Has Lessons               → /dashboard      (homestead-gated, but that's fine —
 *                                                  if they have lessons they're paid
 *                                                  or were paid at some point)
 *
 * This exists because the old default (→ /dashboard) dumped free-tier
 * users on a TierGate upgrade wall with no content.
 */
export default async function WelcomePage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const [latestCompass, lessonCount] = await Promise.all([
    prisma.compassResult.findFirst({
      where: { accountId: userId },
      orderBy: { createdAt: "desc" },
      select: { philosophyBlend: true },
    }),
    prisma.lesson.count({ where: { userId } }),
  ]);

  if (!latestCompass) {
    redirect("/compass");
  }

  if (lessonCount === 0) {
    const blend = (latestCompass.philosophyBlend as Record<string, number>) ?? {};
    const topPhilosophyId = Object.entries(blend)
      .sort(([, a], [, b]) => b - a)
      .map(([key]) => BLEND_KEY_TO_PHILOSOPHY_ID[key])
      .find(Boolean);

    redirect(topPhilosophyId ? `/create?philosophy=${topPhilosophyId}` : "/create");
  }

  redirect("/dashboard");
}
