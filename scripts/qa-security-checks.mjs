import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const PORT = Number(process.env.QA_PORT || "3092");
const BASE_URL = `http://127.0.0.1:${PORT}`;
const PRIMARY_SLUG = "cumple-7-luis-arturo-astronautas";
const STORE_PATH = path.join(process.cwd(), ".mock-data", "store.json");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(pathname, init = {}) {
  const response = await fetch(`${BASE_URL}${pathname}`, {
    ...init,
    signal: AbortSignal.timeout(15000),
    redirect: "manual",
  });
  return {
    status: response.status,
    body: await response.text(),
    headers: response.headers,
  };
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const res = await fetch(`${BASE_URL}/`, { signal: AbortSignal.timeout(2000) });
      if (res.status >= 200) {
        return true;
      }
    } catch {
      // Continue trying until timeout.
    }
    await sleep(1000);
  }
  return false;
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

async function main() {
  const child = spawn(process.execPath, ["scripts/start.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(PORT),
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
    },
    stdio: "inherit",
  });

  try {
    const ready = await waitForServer();
    assert(ready, "Server did not become ready.");

    // Seed mock store if missing.
    await request(`/api/public/invitations/${encodeURIComponent(PRIMARY_SLUG)}`);

    const rawStore = await readFile(STORE_PATH, "utf8");
    const store = JSON.parse(rawStore);
    const invitations = Array.isArray(store.invitations) ? store.invitations : [];
    assert(invitations.length > 0, "Mock store invitations not found.");

    const first =
      invitations.find((invitation) => invitation.slug === PRIMARY_SLUG) || invitations[0];
    assert(first?.client_view_token, "Primary invitation token missing in mock store.");

    const second = cloneJson(first);
    second.id = randomUUID();
    second.slug = `qa-mix-${Date.now()}`;
    second.client_view_token = `qa-token-${randomUUID()}`;
    second.status = "published";

    store.invitations = [first, second, ...invitations.filter((item) => item.id !== first.id)];
    await writeFile(STORE_PATH, `${JSON.stringify(store, null, 2)}\n`, "utf8");

    console.log("ROUTE_CHECKS");
    const routeChecks = [
      "/",
      "/examples",
      "/admin/login",
      "/admin/invitations",
      "/admin/invitations/new",
      `/admin/invitations/${first.id}`,
      "/admin/site",
      `/i/${first.slug}`,
      `/i/${first.slug}/rsvp?token=${encodeURIComponent(first.client_view_token)}`,
    ];
    for (const route of routeChecks) {
      const out = await request(route);
      console.log(`${route} => ${out.status}`);
    }

    const marker = `QA-MARKER-${Date.now()}`;
    const post = await request(`/api/public/invitations/${encodeURIComponent(first.slug)}/rsvp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: marker,
        attending: true,
        guestsCount: 2,
        message: "no-mix",
      }),
    });

    const pub = await request(`/api/public/invitations/${encodeURIComponent(first.slug)}`);
    const pubPayload = JSON.parse(pub.body);
    const invitation = pubPayload?.invitation ?? {};

    const tokenExposed = Object.prototype.hasOwnProperty.call(invitation, "client_view_token");
    const idExposed = Object.prototype.hasOwnProperty.call(invitation, "id");
    const createdExposed = Object.prototype.hasOwnProperty.call(invitation, "created_at");
    const updatedExposed = Object.prototype.hasOwnProperty.call(invitation, "updated_at");

    const noToken = await request(
      `/api/public/invitations/${encodeURIComponent(first.slug)}/client-rsvp`,
    );
    const badToken = await request(
      `/api/public/invitations/${encodeURIComponent(first.slug)}/client-rsvp?token=token-invalido`,
    );
    const goodToken = await request(
      `/api/public/invitations/${encodeURIComponent(first.slug)}/client-rsvp?token=${encodeURIComponent(first.client_view_token)}`,
    );
    const goodTokenSecond = await request(
      `/api/public/invitations/${encodeURIComponent(second.slug)}/client-rsvp?token=${encodeURIComponent(second.client_view_token)}`,
    );

    const firstResponses = JSON.parse(goodToken.body)?.result?.summary?.responses || [];
    const secondResponses = JSON.parse(goodTokenSecond.body)?.result?.summary?.responses || [];
    const inFirst = firstResponses.some((entry) => entry.name === marker);
    const inSecond = secondResponses.some((entry) => entry.name === marker);

    const legacy = await request("/api/rsvp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "legacy", attending: true }),
    });

    console.log("SECURITY_CHECKS");
    console.log(
      `GET /api/public/invitations/:slug => ${pub.status}, tokenExposed=${tokenExposed}, idExposed=${idExposed}, createdExposed=${createdExposed}, updatedExposed=${updatedExposed}`,
    );
    console.log(`RSVP cliente sin token => ${noToken.status}`);
    console.log(`RSVP token invalido => ${badToken.status}`);
    console.log(`RSVP token valido => ${goodToken.status}`);
    console.log(`RSVP submit publico => ${post.status}`);
    console.log(`No mezcla RSVP => inFirst=${inFirst}, inSecond=${inSecond}`);
    console.log(`Legacy /api/rsvp => ${legacy.status}`);

    assert(pub.status === 200, "Public invitation endpoint did not return 200.");
    assert(!tokenExposed && !idExposed && !createdExposed && !updatedExposed, "Sensitive fields leaked.");
    assert(noToken.status === 401 || noToken.status === 403, "Missing token must return 401/403.");
    assert(badToken.status === 403, "Invalid token must return 403.");
    assert(goodToken.status === 200, "Valid token must return 200.");
    assert(post.status === 200, "Public RSVP submit must return 200.");
    assert(inFirst, "Marker RSVP missing in source invitation.");
    assert(!inSecond, "Marker RSVP leaked to a different invitation.");

    console.log("ALL_CHECKS_PASS");
  } finally {
    child.kill("SIGTERM");
    await sleep(1000);
    if (child.exitCode === null) {
      child.kill("SIGKILL");
    }
  }
}

main().catch((error) => {
  console.error("CHECKS_FAILED");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
