import VeloraApp from "@/components/velora-app";
import { getAppState } from "@/lib/server-state";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const state = await getAppState();
  return <VeloraApp initialState={state} />;
}
