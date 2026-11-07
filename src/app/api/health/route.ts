import { sql } from "drizzle-orm";
import { db } from "@/db";
import { ensureDatabase } from "@/db/setup";
import { demoModeEnabled } from "@/lib/demo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDatabase();
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, demoMode: demoModeEnabled() });
  } catch (error) {
    console.error("Health check failed", error);
    return Response.json({ ok: false }, { status: 500 });
  }
}
