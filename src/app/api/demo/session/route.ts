import { NextResponse } from "next/server";
import { ensureDatabase } from "@/db/setup";
import { auth } from "@/lib/auth";
import { DEMO_ACCOUNT } from "@/lib/catalog";
import { demoModeEnabled } from "@/lib/demo";

export const dynamic = "force-dynamic";

/**
 * Signs a visitor into the showcase account when demo mode is on. Real
 * deployments set LIMH_DEMO_MODE=0 and this endpoint returns 404.
 */
export async function POST() {
  if (!demoModeEnabled()) {
    return NextResponse.json({ error: "Demo mode is off" }, { status: 404 });
  }
  await ensureDatabase();

  const response = await auth.api.signInEmail({
    body: { email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password },
    asResponse: true,
  });

  if (!response.ok) {
    return NextResponse.json({ error: "The demo account is unavailable" }, { status: 502 });
  }

  const next = new NextResponse(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") next.headers.append("set-cookie", value);
  });
  return next;
}
