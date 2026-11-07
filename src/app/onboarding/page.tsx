import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Onboarding from "@/components/onboarding";
import { ensureDatabase } from "@/db/setup";
import { getMemberRow } from "@/lib/server-state";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Build your profile — Love Is My Heart (LIMH)",
};

export default async function OnboardingPage() {
  await ensureDatabase();
  const session = await requireSession("/onboarding");
  const member = await getMemberRow(session.user.id);
  if (member?.onboardingComplete) redirect("/app");

  return (
    <Onboarding
      defaultName={member?.name ?? session.user.name ?? ""}
      defaultCity={member?.city ?? "London"}
    />
  );
}
