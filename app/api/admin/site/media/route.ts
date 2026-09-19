import path from "node:path";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { invitationTypes, type InvitationTypeSlug } from "@/lib/catalog-taxonomy";
import { buildMediaUrl } from "@/lib/media-config";
import { createMediaAsset, findMediaAssetByHash, restoreMediaAsset } from "@/lib/media-repository";
import { getMediaStorageAdapter } from "@/lib/media-storage";
import { detectMedia, sha256, validateMediaForProduct } from "@/lib/media-validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Selecciona un archivo." }, { status: 400 });
    const requestedProduct = String(form.get("invitationType") || "");
    const invitationType = invitationTypes.some((item) => item.slug === requestedProduct) ? requestedProduct as InvitationTypeSlug : null;
    const detected = detectMedia(Buffer.from(await file.arrayBuffer()));
    validateMediaForProduct(detected.assetType, invitationType);
    const requiredMime = invitationType === "imagen-esencial" ? "image/avif"
      : invitationType === "interactiva" ? "application/pdf"
      : invitationType === "video-invitacion" ? "video/webm" : null;
    if (requiredMime && detected.mimeType !== requiredMime) {
      throw new Error(`El tipo ${invitationType} requiere ${requiredMime}.`);
    }
    const hash = sha256(detected.buffer);
    const storage = getMediaStorageAdapter();
    const existing = await findMediaAssetByHash(hash);
    if (existing) {
      if (!(await storage.exists(existing.storage_path))) {
        throw new Error(`El recurso ${existing.id} existe en metadata, pero falta el archivo físico ${existing.storage_path}.`);
      }
      const restored = existing.deleted_at ? await restoreMediaAsset(existing.id) : existing;
      return NextResponse.json({ asset: restored, url: buildMediaUrl(existing.public_path), deduplicated: true });
    }
    const relativePath = `${detected.assetType}/${hash.slice(0, 2)}/${hash}.${detected.extension}`;
    await storage.upload(relativePath, detected.buffer);
    try {
      const asset = await createMediaAsset({
        filename: `${hash}.${detected.extension}`,
        original_filename: path.basename(file.name).replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 180) || `archivo.${detected.extension}`,
        storage_path: relativePath, public_path: relativePath, mime_type: detected.mimeType,
        extension: detected.extension, size_bytes: detected.buffer.length, sha256: hash,
        width: detected.width, height: detected.height, duration_seconds: null, asset_type: detected.assetType,
      });
      return NextResponse.json({ asset, url: buildMediaUrl(asset.public_path), deduplicated: false });
    } catch (metadataError) {
      const concurrentAsset = await findMediaAssetByHash(hash).catch(() => null);
      if (concurrentAsset) {
        return NextResponse.json({ asset: concurrentAsset, url: buildMediaUrl(concurrentAsset.public_path), deduplicated: true });
      }
      try {
        await storage.delete(relativePath);
      } catch (cleanupError) {
        console.error("[media] No se pudo limpiar un upload sin metadata.", {
          hash: hash.slice(0, 12), path: relativePath,
          error: cleanupError instanceof Error ? cleanupError.message : "desconocido",
        });
      }
      throw metadataError;
    }
  } catch (error) {
    console.error("[media] Upload rechazado.", { error: error instanceof Error ? error.message : "desconocido" });
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo cargar el archivo." }, { status: 400 });
  }
}
