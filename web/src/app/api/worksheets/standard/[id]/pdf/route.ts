import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PDF rendering will be fully implemented in Phase 4 after @react-pdf/renderer template is built.
// For now, returns a placeholder response confirming the route works.
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ws = await prisma.standardWorksheet.findUnique({
    where: { id: params.id },
  });
  if (!ws) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Placeholder — returns metadata until WorksheetPdf component is built
  return NextResponse.json({
    id: ws.id,
    title: ws.title,
    status: "pdf_generation_pending",
    message: "PDF template being built in Phase 4",
  });
}
