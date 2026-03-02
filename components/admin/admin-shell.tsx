"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type AdminShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AdminShell({ title, description, children }: AdminShellProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="page-shell" style={{ paddingBottom: 56 }}>
      <header className="admin-topbar">
        <div>
          <strong>Invitaciones Digitales CRM</strong>
        </div>
        <div className="inline-actions">
          <Link href="/admin/invitations" className="ghost-link">
            Invitaciones
          </Link>
          <Link href="/admin/site" className="ghost-link">
            Landing
          </Link>
          <button type="button" className="button-ghost" onClick={handleLogout}>
            Salir
          </button>
        </div>
      </header>
      <section className="admin-panel">
        <p className="eyebrow">CRM</p>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </section>
      {children}
    </main>
  );
}
