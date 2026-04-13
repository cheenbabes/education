import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      error: "gone",
      message:
        "Legacy lesson-generated worksheets were retired. Use /api/worksheets/standard/access instead.",
    },
    { status: 410 },
  );
}
