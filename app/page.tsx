import { SiteHome } from "@/components/site/site-home";
import { getSiteSettings } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const siteSettings = await getSiteSettings();
  return <SiteHome settings={siteSettings.data} />;
}
