import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { ensureDatabase } from "@/db/setup";
import { demoModeEnabled } from "@/lib/demo";
import { getAuthSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in — Love Is My Heart (LIMH)",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  await ensureDatabase();
  if (await getAuthSession()) redirect("/app");
  const params = await searchParams;
  return (
    <AuthForm
      mode="signin"
      next={params.next}
      demoMode={demoModeEnabled()}
    />
  );
}
