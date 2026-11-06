import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { ensureDatabase } from "@/db/setup";
import { demoModeEnabled } from "@/lib/demo";
import { getAuthSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Join LIMH — Love Is My Heart",
};

export default async function JoinPage() {
  await ensureDatabase();
  if (await getAuthSession()) redirect("/app");
  return <AuthForm mode="join" demoMode={demoModeEnabled()} />;
}
