import { Urbanist } from "next/font/google";
import { InvitationCatalog } from "@/components/site/InvitationCatalog";
import { getCatalogItems } from "@/lib/invitation-catalog";
import { getSiteSettings } from "@/lib/repository";
import { normalizeSiteSettingsData } from "@/lib/site-settings-defaults";
const catalogFont = Urbanist({ subsets: ["latin"], variable: "--font-catalog", weight: ["400", "500", "600", "700", "800"] });
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Invitaciones digitales | Gloobi",
  description: "Explora invitaciones digitales interactivas para cumpleaños, XV años, bodas, celebraciones infantiles y eventos especiales.",
};
export default async function InvitationsPage() {
  const [items, settingsRecord] = await Promise.all([getCatalogItems(), getSiteSettings()]);
  const settings = normalizeSiteSettingsData(settingsRecord.data);
  return <div className={catalogFont.variable}><InvitationCatalog items={items} page={settings.pages.catalog} /></div>;
}
