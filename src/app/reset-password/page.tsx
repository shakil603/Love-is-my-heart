import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Choose a new password — Love Is My Heart (LIMH)",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return <ResetPasswordForm token={params.token ?? ""} />;
}
