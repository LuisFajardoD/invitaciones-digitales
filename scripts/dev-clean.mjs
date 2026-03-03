import { clearNextCache, stopLocalDevListeners } from "./dev-runtime.mjs";

const force = process.argv.includes("--force");

await stopLocalDevListeners({
  label: "dev-clean",
  force,
});

clearNextCache();
console.log(force
  ? "[dev-clean] Se cerro el stack local (modo force) y se limpio .next."
  : "[dev-clean] Se cerro el stack local del proyecto y se limpio .next.");
