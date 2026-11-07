import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/session";
import { getAppState, OnboardingRequiredError } from "@/lib/server-state";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const current = await getApiUser();
    if (!current) {
      return NextResponse.json({ error: "Sign in to see your matches" }, { status: 401 });
    }
    return NextResponse.json({ state: await getAppState(current.id) });
  } catch (error) {
    if (error instanceof OnboardingRequiredError) {
      return NextResponse.json({ error: error.message, onboarding: true }, { status: 409 });
    }
    console.error("State failed", error);
    return NextResponse.json({ error: "Could not load your space" }, { status: 500 });
  }
}
