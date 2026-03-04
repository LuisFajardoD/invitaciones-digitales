"use client";

import dynamic from "next/dynamic";
import "../../frontend/src/styles.css";

const PublicReactApp = dynamic(() => import("@/frontend/src/App").then((module) => module.App), {
  ssr: false,
});

export function ViewerReactApp() {
  return <PublicReactApp />;
}
