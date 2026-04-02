import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Gets or creates a User record in the DB, storing the real Clerk email.
 * Only calls Clerk's API when the user doesn't exist yet or still has a placeholder email.
 * All other routes should call this instead of bare prisma.user.upsert.
 */
export async function getOrCreateUser(userId: string) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, tier: true },
  });

  if (existing && !existing.email.endsWith("@clerk.placeholder")) {
    return existing;
  }

  // First time or still has placeholder — fetch real email from Clerk
  const clerkUser = await currentUser();
  const email =
    clerkUser?.emailAddresses?.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    )?.emailAddress ?? `${userId}@clerk.placeholder`;

  return prisma.user.upsert({
    where: { id: userId },
    update: { email },
    create: { id: userId, email },
  });
}
