import { clearNextCache, stopLocalDevListeners } from "./dev-runtime.mjs";

const closedListeners = await stopLocalDevListeners({
  label: "predev",
  ports: [3000, 3001],
});

if (closedListeners.length) {
  clearNextCache();
  console.log("[predev] Se limpio .next porque el preflight detecto listeners stale del repo.");
}
