import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { getAdminSession } from "@/lib/auth";
import { isUsingMockData } from "@/lib/repository";

export default async function AdminPage() {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin/invitations");
  }

  return <LoginForm useMock={isUsingMockData()} />;
}
