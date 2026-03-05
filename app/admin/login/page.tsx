"use client";

import dynamic from "next/dynamic";
import "../../../src/crm/styles.css";

const AdminReactApp = dynamic(() => import("@/src/crm/App").then((module) => module.App), {
  ssr: false,
});

export default function AdminLoginPage() {
  return (
    <div className="app-admin">
      <AdminReactApp />
    </div>
  );
}
