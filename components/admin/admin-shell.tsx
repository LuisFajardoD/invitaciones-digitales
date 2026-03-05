"use client";

import { PublicShell } from "@/components/site/PublicShell";

type AdminShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AdminShell({ title, description, children }: AdminShellProps) {
  return (
    <PublicShell showSiteLink>
      <section className="admin-panel">
        <p className="eyebrow">CRM</p>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </section>
      {children}
    </PublicShell>
  );
}
