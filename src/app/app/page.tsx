import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LimhApp from "@/components/limh-app";
import { ensureDatabase } from "@/db/setup";
import { getAppState, getMemberRow } from "@/lib/server-state";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your space — Love Is My Heart (LIMH)",
};

export default async function AppPage() {
  await ensureDatabase();
  const session = await requireSession("/app");
  const member = await getMemberRow(session.user.id);
  if (!member?.onboardingComplete) redirect("/onboarding");

  const state = await getAppState(session.user.id);
  return <LimhApp initialState={state} />;
}
