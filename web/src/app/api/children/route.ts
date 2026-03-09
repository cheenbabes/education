import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/children — list children for a user
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") || "demo-user";

  const children = await prisma.child.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(children);
}

// POST /api/children — create a child profile
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, dateOfBirth, gradeLevel, standardsOptIn = true, userId = "demo-user" } = body;

  const child = await prisma.child.create({
    data: {
      userId,
      name,
      dateOfBirth: new Date(dateOfBirth),
      gradeLevel,
      standardsOptIn,
    },
  });

  return NextResponse.json(child);
}
