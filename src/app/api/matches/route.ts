import { NextResponse } from "next/server";
import { matches } from "@/lib/match-data";

export async function GET() {
  return NextResponse.json(matches);
}
