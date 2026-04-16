import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * Server-side admin gate for API routes.
 *
 * Returns the Clerk userId if the caller is an admin,
 * or a 401/403 NextResponse to return directly.
 *
 * Usage:
 *   const result = await requireAdmin();
 *   if (result instanceof NextResponse) return result;
 *   const userId = result;
 */
export async function requireAdmin(): Promise<string | NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return userId;
}
