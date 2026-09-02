import CockpitBuilder from "@/components/cockpit-builder";
import { getCatalog } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

export default async function Home() {
  const catalog = await getCatalog();
  return <CockpitBuilder domains={catalog.domains} packs={catalog.packs} />;
}
