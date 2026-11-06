import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/session";
import { getAppState } from "@/lib/server-state";

export const dynamic = "force-dynamic";

export async function GET() {
  const current = await getApiUser();
  if (!current) return NextResponse.json({ error: "Sign in to export your data" }, { status: 401 });

  const state = await getAppState(current.id);
  const payload = {
    exportedAt: new Date().toISOString(),
    product: "Love Is My Heart",
    account: { id: current.id, email: current.email, name: current.name },
    member: state.member,
    preferences: state.preferences,
    interactions: state.interactions,
    matches: state.matches,
    blockedProfileIds: state.blockedProfileIds,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="limh-data-${new Date()
        .toISOString()
        .slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
