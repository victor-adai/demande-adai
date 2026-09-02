import { getCatalog } from "@/lib/server/catalog";
import CatalogueEditor from "./catalogue-editor";

export const dynamic = "force-dynamic";

export default async function CataloguePage() {
  const catalog = await getCatalog();

  return <CatalogueEditor initialDomains={catalog.domains} initialPacks={catalog.packs} />;
}
