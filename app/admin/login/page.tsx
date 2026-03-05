"use client";

import dynamic from "next/dynamic";

const AdminReactApp = dynamic(() => import("@/src/crm/App").then((module) => module.App), {
  ssr: false,
});

export default function AdminLoginPage() {
  return <AdminReactApp />;
}
