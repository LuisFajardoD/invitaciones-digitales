"use client";

import dynamic from "next/dynamic";
import "../../src/crm/styles.css";

const PublicReactApp = dynamic(() => import("@/src/crm/App").then((module) => module.App), {
  ssr: false,
});

export function ViewerReactApp() {
  return <PublicReactApp />;
}

