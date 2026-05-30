import { notFound } from "next/navigation";
import { EventIntakeForm } from "@/components/intake/EventIntakeForm";
import { getEventIntakeFormByToken } from "@/lib/repository";

export const dynamic = "force-dynamic";

type BriefPageProps = {
  params: Promise<{ token: string }>;
};

export default async function BriefPage({ params }: BriefPageProps) {
  const { token } = await params;
  const form = await getEventIntakeFormByToken(token);

  if (!form) {
    notFound();
  }

  return <EventIntakeForm form={form} />;
}
