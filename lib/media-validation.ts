import { createHash } from "node:crypto";
import type { InvitationTypeSlug } from "@/lib/catalog-taxonomy";
import type { MediaAssetType } from "@/types/media";

export type DetectedMedia = { mimeType: string; extension: string; assetType: MediaAssetType; buffer: Buffer; width: number | null; height: number | null };

const MAX_BYTES: Record<MediaAssetType, number> = {
  image: 20 * 1024 * 1024,
  svg: 2 * 1024 * 1024,
  video: 150 * 1024 * 1024,
  pdf: 30 * 1024 * 1024,
  other: 0,
};

const PRODUCT_ASSETS: Record<InvitationTypeSlug, MediaAssetType[]> = {
  "imagen-esencial": ["image"],
  interactiva: ["image", "pdf"],
  "video-invitacion": ["image", "video"],
  "web-esencial": ["image", "svg", "video"],
  "web-premium": ["image", "svg", "video"],
};

function isAscii(buffer: Buffer, offset: number, value: string) {
  return buffer.subarray(offset, offset + value.length).toString("ascii") === value;
}

function sanitizeSvg(buffer: Buffer) {
  const source = buffer.toString("utf8").replace(/^\uFEFF/, "");
  if (!/<svg[\s>]/i.test(source)) throw new Error("El archivo no contiene un SVG válido.");
  const forbidden = [
    /<!doctype/i, /<!entity/i, /<script[\s>]/i, /<foreignObject[\s>]/i,
    /\son[a-z]+\s*=/i, /javascript\s*:/i, /vbscript\s*:/i,
    /data\s*:\s*text\/html/i, /<iframe[\s>]/i, /<object[\s>]/i, /<embed[\s>]/i,
    /@import/i, /expression\s*\(/i,
  ];
  if (forbidden.some((pattern) => pattern.test(source))) {
    throw new Error("El SVG contiene código activo o referencias no permitidas.");
  }
  const externalReference = /(?:href|src)\s*=\s*["'](?!#|data:image\/(?:png|jpeg|webp);base64,)[^"']+["']/i;
  if (externalReference.test(source)) throw new Error("El SVG no puede cargar recursos externos.");
  return Buffer.from(source.replace(/<!--([\s\S]*?)-->/g, ""), "utf8");
}

function readJpegSize(buffer: Buffer) {
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) break;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    if (length < 2) break;
    offset += 2 + length;
  }
  return { width: null, height: null };
}

export function detectMedia(input: Buffer): DetectedMedia {
  let mimeType = ""; let extension = ""; let assetType: MediaAssetType = "other";
  let width: number | null = null; let height: number | null = null; let buffer = input;
  if (input.length >= 24 && input.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
    mimeType = "image/png"; extension = "png"; assetType = "image"; width = input.readUInt32BE(16); height = input.readUInt32BE(20);
  } else if (input.length >= 12 && input[0] === 0xff && input[1] === 0xd8 && input[2] === 0xff) {
    mimeType = "image/jpeg"; extension = "jpg"; assetType = "image"; ({ width, height } = readJpegSize(input));
  } else if (input.length >= 12 && isAscii(input, 0, "RIFF") && isAscii(input, 8, "WEBP")) {
    mimeType = "image/webp"; extension = "webp"; assetType = "image";
  } else if (input.length >= 12 && isAscii(input, 4, "ftyp") && ["avif", "avis"].includes(input.subarray(8, 12).toString("ascii"))) {
    mimeType = "image/avif"; extension = "avif"; assetType = "image";
  } else if (input.length >= 5 && isAscii(input, 0, "%PDF-")) {
    mimeType = "application/pdf"; extension = "pdf"; assetType = "pdf";
  } else if (input.length >= 12 && isAscii(input, 4, "ftyp")) {
    mimeType = "video/mp4"; extension = "mp4"; assetType = "video";
  } else if (input.length >= 4 && input.subarray(0, 4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]))) {
    mimeType = "video/webm"; extension = "webm"; assetType = "video";
  } else if (/^\s*(?:<\?xml[^>]*>\s*)?<svg[\s>]/i.test(input.subarray(0, Math.min(input.length, 4096)).toString("utf8"))) {
    buffer = sanitizeSvg(input); mimeType = "image/svg+xml"; extension = "svg"; assetType = "svg";
  }
  if (assetType === "other") throw new Error("El contenido del archivo no corresponde a un formato multimedia permitido.");
  if (buffer.length > MAX_BYTES[assetType]) throw new Error(`El archivo supera el límite de ${Math.round(MAX_BYTES[assetType] / 1024 / 1024)} MB para ${assetType}.`);
  return { mimeType, extension, assetType, buffer, width, height };
}

export function validateMediaForProduct(assetType: MediaAssetType, invitationType?: InvitationTypeSlug | null) {
  if (!invitationType) {
    if (!["image", "svg", "video"].includes(assetType)) throw new Error("Este tipo de archivo no se admite para contenido general del sitio.");
    return;
  }
  if (!PRODUCT_ASSETS[invitationType]?.includes(assetType)) throw new Error(`El formato no corresponde al producto ${invitationType}.`);
}

export function sha256(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export const mediaAcceptByProduct: Record<InvitationTypeSlug, string> = {
  "imagen-esencial": ".jpg,.jpeg,.png,.webp,.avif",
  interactiva: ".pdf,.jpg,.jpeg,.png,.webp,.avif",
  "video-invitacion": ".mp4,.webm,.jpg,.jpeg,.png,.webp,.avif",
  "web-esencial": ".jpg,.jpeg,.png,.webp,.avif,.svg,.mp4,.webm",
  "web-premium": ".jpg,.jpeg,.png,.webp,.avif,.svg,.mp4,.webm",
};
