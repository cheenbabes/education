import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function requireAdminPage(): Promise<string> {
  const { userId } = await auth();
  if (!userId) notFound();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== "admin") notFound();
  return userId;
}
