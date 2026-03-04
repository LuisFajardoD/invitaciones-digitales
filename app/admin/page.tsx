"use client";

import dynamic from "next/dynamic";
import "../../frontend/src/styles.css";

const AdminReactApp = dynamic(() => import("@/frontend/src/App").then((module) => module.App), {
  ssr: false,
});

export default function AdminPage() {
  return <AdminReactApp />;
}
