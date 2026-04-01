import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// GET /api/worksheets — list all worksheets for the current user with lesson info
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const worksheets = await prisma.worksheet.findMany({
    where: { userId },
    include: {
      lesson: {
        select: { id: true, title: true, philosophy: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(worksheets);
}
