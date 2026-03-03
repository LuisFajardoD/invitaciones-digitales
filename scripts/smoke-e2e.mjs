import { chromium } from "playwright";
import process from "node:process";

const backendOrigin = (process.env.SMOKE_BACKEND_ORIGIN || process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:3000").replace(/\/+$/, "");
const invitationId = process.env.SMOKE_INVITATION_ID || "11111111-1111-4111-8111-111111111111";
const invitationSlug = process.env.SMOKE_INVITATION_SLUG || "cumple-7-luis-arturo-astronautas";

async function ensureNoRuntimeErrors(page, label) {
  const runtimeIssues = [];

  const onConsole = (message) => {
    if (message.type() === "error") {
      runtimeIssues.push(`console: ${message.text()}`);
    }
  };

  const onPageError = (error) => {
    runtimeIssues.push(`pageerror: ${error.message}`);
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  await page.waitForTimeout(500);

  page.off("console", onConsole);
  page.off("pageerror", onPageError);

  if (runtimeIssues.length) {
    throw new Error(`${label} encontro errores runtime:\n${runtimeIssues.join("\n")}`);
  }
}

async function loginIfNeeded(page) {
  await page.goto(`${backendOrigin}/admin`, { waitUntil: "networkidle" });

  const emailField = page.getByLabel("Email");
  if (!(await emailField.isVisible().catch(() => false))) {
    return;
  }

  await emailField.fill("demo@invitaciones.local");
  await page.getByLabel("Contrasena").fill("demo12345");
  await Promise.all([
    page.waitForURL(/\/admin\/invitations/, { timeout: 15000 }),
    page.getByRole("button", { name: "Entrar" }).click(),
  ]);
}

async function testAdminEditorPreview(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();

  await loginIfNeeded(page);
  await ensureNoRuntimeErrors(page, "login");

  await page.goto(`${backendOrigin}/admin/invitations/${invitationId}`, {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  await page.getByRole("button", { name: "Vista real (screenshot)" }).click();
  await page.getByRole("button", { name: "Regenerar" }).click();
  await page.locator("img[alt^='Vista previa en']").first().waitFor({ timeout: 30000 });
  await ensureNoRuntimeErrors(page, "editor");
  await context.close();
}

async function testPublicViewer(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${backendOrigin}/i/${invitationSlug}`, {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  const bodyText = await page.locator("body").innerText();
  if (bodyText.includes("No disponible") || bodyText.includes("Loading chunk failed")) {
    throw new Error("El viewer publico mostro un estado de error.");
  }

  const headings = await page.locator("h1, h2").allTextContents();
  if (!headings.some((value) => value.trim())) {
    throw new Error("El viewer publico no renderizo encabezados visibles.");
  }

  await ensureNoRuntimeErrors(page, "viewer");
  await context.close();
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  try {
    await testAdminEditorPreview(browser);
    console.log("PASS admin-editor-preview");
    await testPublicViewer(browser);
    console.log("PASS public-viewer");
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
