import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Preguntas frecuentes | Gloobi",
  description: "Resuelve tus dudas sobre invitaciones digitales Gloobi, personalización, demos, confirmación de asistencia, entrega y funcionamiento.",
};

export default function FaqPage() {
  redirect("/faq.html");
}
