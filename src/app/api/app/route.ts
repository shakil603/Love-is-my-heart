import { NextResponse } from "next/server";
import { getAppState } from "@/lib/server-state";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ state: await getAppState() });
  } catch (error) {
    console.error("State failed", error);
    return NextResponse.json({ error: "Could not load your space" }, { status: 500 });
  }
}
