import { createHash } from "crypto";
import { access, mkdir, readdir, stat, unlink } from "fs/promises";
import path from "path";
import { chromium } from "playwright";
import type { InvitationRecord } from "@/types/invitations";
import { getInvitationById, getPublicInvitationBySlug } from "@/lib/repository";
import { getPreviewDeviceProfile, type PreviewDeviceId, type PreviewDeviceProfile } from "@/lib/preview/devices";

const PREVIEW_DIR = path.join(process.cwd(), "public", "generated-previews");
const PREVIEW_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const inFlightPreviewRenders = new Map<string, Promise<PreviewRenderResult>>();

export type PreviewCaptureMode = "viewport" | "fullpage";

type PreviewRequestInput = {
  request: Request;
  invitationId?: string;
  slug?: string;
  deviceId: PreviewDeviceId;
  force: boolean;
  mode: PreviewCaptureMode;
};

type PreviewRenderResult = {
  invitation: InvitationRecord;
  device: PreviewDeviceProfile;
  previewUrl: string;
  cached: boolean;
  generatedAt: string;
  mode: PreviewCaptureMode;
};

function sanitizeFileToken(value: string) {
  return value.replace(/[^a-zA-Z0-9-_]/g, "-");
}

function createPreviewHash(input: unknown) {
  return createHash("sha1").update(JSON.stringify(input)).digest("hex").slice(0, 12);
}

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function cleanupExpiredPreviewFiles() {
  await mkdir(PREVIEW_DIR, { recursive: true });
  const now = Date.now();
  const files = await readdir(PREVIEW_DIR);

  await Promise.all(
    files.map(async (fileName) => {
      const filePath = path.join(PREVIEW_DIR, fileName);
      try {
        const metadata = await stat(filePath);
        if (now - metadata.mtimeMs > PREVIEW_TTL_MS) {
          await unlink(filePath);
        }
      } catch {
        // ignore cleanup failures
      }
    }),
  );
}

async function cleanPreviousVariants(prefix: string, keepFileName: string) {
  try {
    const files = await readdir(PREVIEW_DIR);
    await Promise.all(
      files
        .filter((fileName) => fileName.startsWith(prefix) && fileName !== keepFileName)
        .map((fileName) => unlink(path.join(PREVIEW_DIR, fileName)).catch(() => undefined)),
    );
  } catch {
    // ignore cleanup failures
  }
}

function buildRequestOrigin(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || url.host;
  const protocol = request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  return `${protocol}://${host}`;
}

function createRenderKey(args: {
  invitationId: string;
  slug: string;
  deviceId: PreviewDeviceId;
  mode: PreviewCaptureMode;
  contentHash: string;
}) {
  return `${args.invitationId}:${args.slug}:${args.deviceId}:${args.mode}:${args.contentHash}`;
}

async function renderInternal(input: PreviewRequestInput): Promise<PreviewRenderResult> {
  const device = getPreviewDeviceProfile(input.deviceId);
  if (!device) {
    throw new Error("Perfil de dispositivo no válido.");
  }

  const invitation = input.invitationId
    ? await getInvitationById(input.invitationId)
    : input.slug
      ? await getPublicInvitationBySlug(input.slug)
      : null;

  if (!invitation) {
    throw new Error("Invitación no encontrada o no publicada.");
  }

  await mkdir(PREVIEW_DIR, { recursive: true });
  await cleanupExpiredPreviewFiles();

  const contentHash = createPreviewHash({
    id: invitation.id,
    slug: invitation.slug,
    status: invitation.status,
    updated_at: invitation.updated_at,
    event_start_at: invitation.event_start_at,
    active_until: invitation.active_until,
    sections_order: invitation.sections_order,
    sections: invitation.sections,
    background: invitation.background,
    renderFlags: {
      mode: input.mode,
      bridgeBypass: true,
      reducedMotion: true,
      colorScheme: "dark",
    },
  });

  const renderKey = createRenderKey({
    invitationId: invitation.id,
    slug: invitation.slug,
    deviceId: device.id,
    mode: input.mode,
    contentHash,
  });

  const filePrefix = `${sanitizeFileToken(invitation.id)}-${sanitizeFileToken(device.id)}-${sanitizeFileToken(input.mode)}-`;
  const fileName = `${filePrefix}${contentHash}.png`;
  const filePath = path.join(PREVIEW_DIR, fileName);

  if (!input.force && (await fileExists(filePath))) {
    return {
      invitation,
      device,
      previewUrl: `/generated-previews/${fileName}`,
      cached: true,
      generatedAt: invitation.updated_at,
      mode: input.mode,
    };
  }

  const existingRender = inFlightPreviewRenders.get(renderKey);
  if (existingRender) {
    return existingRender;
  }

  const renderPromise = (async (): Promise<PreviewRenderResult> => {
    const origin = buildRequestOrigin(input.request);
    const targetUrl = `${origin}/i/${encodeURIComponent(invitation.slug)}?no_react_bridge=1&preview_device=${encodeURIComponent(
      device.id,
    )}`;

    const browser = await chromium.launch({ headless: true });

    try {
      const context = await browser.newContext({
        viewport: device.viewport,
        userAgent: device.userAgent,
        deviceScaleFactor: device.dpr,
        isMobile: device.isMobile,
        hasTouch: device.hasTouch,
      });

      const page = await context.newPage();

      await page.addInitScript(() => {
        Object.defineProperty(navigator, "maxTouchPoints", {
          configurable: true,
          get() {
            return 5;
          },
        });
      });

      await page.emulateMedia({
        reducedMotion: "reduce",
        colorScheme: "dark",
      });

      const consoleEntries: string[] = [];
      page.on("console", (message) => {
        consoleEntries.push(`[${message.type()}] ${message.text()}`);
      });

      await page.goto(targetUrl, {
        waitUntil: "networkidle",
        timeout: 45000,
      });

      await page.evaluate(async () => {
        if ("fonts" in document) {
          await (document as Document & { fonts: FontFaceSet }).fonts.ready;
        }
      });

      await page.addStyleTag({
        content: `
          :root {
            color-scheme: dark !important;
          }

          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            animation-iteration-count: 1 !important;
            transition: none !important;
            caret-color: transparent !important;
            scroll-behavior: auto !important;
          }
        `,
      });

      await page.screenshot({
        path: filePath,
        fullPage: input.mode === "fullpage",
        type: "png",
      });

      if (process.env.NODE_ENV !== "production" && consoleEntries.length) {
        const logPath = path.join(PREVIEW_DIR, `${filePrefix}${contentHash}.log`);
        await import("fs/promises").then(({ writeFile }) =>
          writeFile(logPath, consoleEntries.join("\n"), "utf8").catch(() => undefined),
        );
      }

      await context.close();
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        const debugPath = path.join(PREVIEW_DIR, `${filePrefix}${contentHash}.error.txt`);
        await import("fs/promises").then(({ writeFile }) =>
          writeFile(
            debugPath,
            error instanceof Error ? error.stack || error.message : "Render error",
            "utf8",
          ).catch(() => undefined),
        );
      }
      throw error;
    } finally {
      await browser.close();
    }

    await cleanPreviousVariants(filePrefix, fileName);

    return {
      invitation,
      device,
      previewUrl: `/generated-previews/${fileName}`,
      cached: false,
      generatedAt: new Date().toISOString(),
      mode: input.mode,
    };
  })();

  inFlightPreviewRenders.set(renderKey, renderPromise);

  try {
    return await renderPromise;
  } finally {
    inFlightPreviewRenders.delete(renderKey);
  }
}

export async function renderInvitationPreviewScreenshot(input: PreviewRequestInput) {
  return renderInternal(input);
}
