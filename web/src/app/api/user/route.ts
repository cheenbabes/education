import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// GET /api/user — get current user profile
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Auto-create User record if needed
  const user = await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, email: `${userId}@clerk.placeholder` },
  });
  return NextResponse.json(user);
}

// PUT /api/user — update user profile (state, name)
export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(body.state !== undefined && { state: body.state }),
      ...(body.name !== undefined && { name: body.name }),
    },
  });
  return NextResponse.json(user);
}
