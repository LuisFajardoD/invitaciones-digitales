import { notFound } from "next/navigation";
import { IntakeSummary } from "@/components/intake/IntakeSummary";
import { requireAdminSession } from "@/lib/auth";
import { getEventIntakeFormById } from "@/lib/repository";

export const dynamic = "force-dynamic";

type AdminIntakePageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminIntakePage({ params }: AdminIntakePageProps) {
  await requireAdminSession();
  const { id } = await params;
  const form = await getEventIntakeFormById(id);

  if (!form) {
    notFound();
  }

  return <IntakeSummary form={form} />;
}
