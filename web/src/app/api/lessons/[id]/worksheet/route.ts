import { NextResponse } from "next/server";

function retiredResponse() {
  return NextResponse.json(
    {
      error: "gone",
      message:
        "Legacy lesson-generated worksheets were retired. Use /api/lessons/[id]/standard-worksheets and /api/worksheets/standard/[id]/pdf instead.",
    },
    { status: 410 },
  );
}

export async function GET() {
  return retiredResponse();
}

export async function POST() {
  return retiredResponse();
}
