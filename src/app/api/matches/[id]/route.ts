import { NextResponse } from "next/server";
import { matches } from "@/lib/match-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const match = matches.find((m) => m.id === id);

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  return NextResponse.json(match);
}
