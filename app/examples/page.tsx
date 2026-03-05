import { Landing } from "@/components/site/Landing";
import { getSiteSettings } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function ExamplesPage() {
  const siteSettings = await getSiteSettings();
  return <Landing settings={siteSettings.data} variant="examples" />;
}
