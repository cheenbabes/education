import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/user — get current user profile
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") || "demo-user";
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

// PUT /api/user — update user profile (state, name)
export async function PUT(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") || "demo-user";
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
