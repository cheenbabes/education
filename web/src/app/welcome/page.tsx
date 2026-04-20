import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BLEND_KEY_TO_PHILOSOPHY_ID } from "@/lib/archetype-utils";

export const dynamic = "force-dynamic";

/**
 * Post-sign-in / post-sign-up smart redirect.
 *
 * Routes users based on what they have:
 *
 *   - No CompassResult  → /compass  (take the quiz first)
 *   - Has CompassResult → /create?philosophy={top}  (make your first / next lesson)
 *
 * /dashboard is gated to Homestead+ only, so sending compass-tier users
 * there on login hits an upgrade wall. Paid users reach /dashboard via
 * the nav Planner dropdown; /welcome always routes to /create.
 */
export default async function WelcomePage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const latestCompass = await prisma.compassResult.findFirst({
    where: { accountId: userId },
    orderBy: { createdAt: "desc" },
    select: { philosophyBlend: true },
  });

  if (!latestCompass) {
    redirect("/compass");
  }

  const blend = (latestCompass.philosophyBlend as Record<string, number>) ?? {};
  const topPhilosophyId = Object.entries(blend)
    .sort(([, a], [, b]) => b - a)
    .map(([key]) => BLEND_KEY_TO_PHILOSOPHY_ID[key])
    .find(Boolean);

  redirect(topPhilosophyId ? `/create?philosophy=${topPhilosophyId}` : "/create");
}
