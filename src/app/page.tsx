import Landing from "@/components/landing";
import { demoModeEnabled } from "@/lib/demo";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return <Landing demoMode={demoModeEnabled()} />;
}
