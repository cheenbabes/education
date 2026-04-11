import { prisma } from "@/lib/prisma";

export async function findOwnedChild(userId: string, childId: string) {
  return prisma.child.findFirst({
    where: { id: childId, userId },
    include: {
      user: {
        select: { state: true },
      },
    },
  });
}
