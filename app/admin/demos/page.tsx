import { listDemoInvitations } from "@/lib/repository";
import { DemosDashboard } from "@/components/admin/demos-dashboard";

export const revalidate = 0;

export default async function AdminDemosPage() {
  const demos = await listDemoInvitations();

  return <DemosDashboard initialDemos={demos} />;
}
