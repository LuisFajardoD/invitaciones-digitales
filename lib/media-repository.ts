import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildMediaUrl } from "@/lib/media-config";
import { getMediaStorageAdapter } from "@/lib/media-storage";
import { hasConfiguredSupabase } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import type { MediaAsset, MediaAssetType, MediaAssetWithUsage, MediaEntityType, MediaUsage } from "@/types/media";

type MediaStore = { assets: MediaAsset[]; usages: MediaUsage[] };
const STORE_PATH = path.join(process.cwd(), ".mock-data", "media.json");
function usesMediaMock() {
  const configured = process.env.MEDIA_METADATA_BACKEND?.trim().toLowerCase();
  if (configured === "mock") return true;
  if (configured === "supabase") return false;
  if (process.env.MEDIA_BACKEND?.trim().toLowerCase() === "hostinger") return !hasConfiguredSupabase();
  return process.env.NODE_ENV !== "production" || !hasConfiguredSupabase();
}

async function readStore(): Promise<MediaStore> {
  try { return JSON.parse(await readFile(STORE_PATH, "utf8")) as MediaStore; }
  catch { return { assets: [], usages: [] }; }
}
async function writeStore(store: MediaStore) {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function findMediaAssetByHash(hash: string) {
  if (usesMediaMock()) return (await readStore()).assets.find((asset) => asset.sha256 === hash) || null;
  const client = createServiceSupabaseClient();
  const { data, error } = await client!.from("media_assets").select("*").eq("sha256", hash).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as MediaAsset | null) || null;
}

export async function createMediaAsset(input: Omit<MediaAsset, "id" | "created_at" | "updated_at" | "deleted_at">) {
  const now = new Date().toISOString();
  const asset: MediaAsset = { ...input, id: randomUUID(), created_at: now, updated_at: now, deleted_at: null };
  if (usesMediaMock()) { const store = await readStore(); store.assets.push(asset); await writeStore(store); return asset; }
  const client = createServiceSupabaseClient();
  const { data, error } = await client!.from("media_assets").insert(asset).select("*").single();
  if (error) throw new Error(error.message);
  return data as MediaAsset;
}

export async function restoreMediaAsset(id: string) {
  const now = new Date().toISOString();
  const current = (await listMediaAssets({ includeTrash: true })).find((asset) => asset.id === id);
  if (!current) return null;
  if (!(await getMediaStorageAdapter().exists(current.storage_path))) {
    throw new Error(`No se puede restaurar ${id}: falta el archivo físico ${current.storage_path}.`);
  }
  if (usesMediaMock()) { const store = await readStore(); const asset = store.assets.find((item) => item.id === id); if (!asset) return null; asset.deleted_at = null; asset.updated_at = now; await writeStore(store); return asset; }
  const client = createServiceSupabaseClient();
  const { data, error } = await client!.from("media_assets").update({ deleted_at: null, updated_at: now }).eq("id", id).select("*").maybeSingle();
  if (error) throw new Error(error.message); return data as MediaAsset | null;
}

export async function listMediaAssets(options: { type?: MediaAssetType; search?: string; includeTrash?: boolean } = {}): Promise<MediaAssetWithUsage[]> {
  let assets: MediaAsset[]; let usages: MediaUsage[];
  if (usesMediaMock()) { const store = await readStore(); assets = store.assets; usages = store.usages; }
  else {
    const client = createServiceSupabaseClient();
    const [assetResult, usageResult] = await Promise.all([client!.from("media_assets").select("*").order("created_at", { ascending: false }), client!.from("media_usages").select("*")]);
    if (assetResult.error) throw new Error(assetResult.error.message); if (usageResult.error) throw new Error(usageResult.error.message);
    assets = (assetResult.data || []) as MediaAsset[]; usages = (usageResult.data || []) as MediaUsage[];
  }
  const query = options.search?.trim().toLowerCase();
  return assets.filter((asset) => (options.includeTrash || !asset.deleted_at) && (!options.type || asset.asset_type === options.type) && (!query || asset.original_filename.toLowerCase().includes(query) || asset.filename.toLowerCase().includes(query))).map((asset) => ({ ...asset, usage_count: usages.filter((usage) => usage.asset_id === asset.id).length, usages: usages.filter((usage) => usage.asset_id === asset.id) }));
}

function collectMediaPaths(value: unknown, prefix = "root", output: Map<string, string[]> = new Map()) {
  if (typeof value === "string") {
    output.set(prefix, [value]);
  } else if (Array.isArray(value)) value.forEach((item, index) => collectMediaPaths(item, `${prefix}.${index}`, output));
  else if (value && typeof value === "object") Object.entries(value).forEach(([key, item]) => collectMediaPaths(item, `${prefix}.${key}`, output));
  return output;
}

function matchesAssetUrl(value: string, asset: MediaAsset) {
  const normalized = value.split("?")[0].replace(/\\/g, "/");
  return normalized === buildMediaUrl(asset.public_path) || normalized.endsWith(`/${asset.public_path}`);
}

export async function syncMediaUsages(entityType: MediaEntityType, entityId: string, data: unknown) {
  const fields = collectMediaPaths(data);
  const assets = await listMediaAssets({ includeTrash: true });
  const desired = [...fields].flatMap(([fieldName, values]) => values.flatMap((value) => { const asset = assets.find((item) => matchesAssetUrl(value, item)); return asset ? [{ asset, fieldName }] : []; }));
  if (usesMediaMock()) {
    const store = await readStore();
    store.usages = store.usages.filter((usage) => !(usage.entity_type === entityType && usage.entity_id === entityId));
    desired.forEach(({ asset, fieldName }) => store.usages.push({ id: randomUUID(), asset_id: asset.id, entity_type: entityType, entity_id: entityId, field_name: fieldName, created_at: new Date().toISOString() }));
    const usedIds = new Set(store.usages.map((usage) => usage.asset_id));
    store.assets.forEach((asset) => { if (desired.some((item) => item.asset.id === asset.id)) asset.deleted_at = null; else if (!usedIds.has(asset.id) && !asset.deleted_at) asset.deleted_at = new Date().toISOString(); });
    await writeStore(store); return;
  }
  const client = createServiceSupabaseClient();
  const { error: deleteError } = await client!.from("media_usages").delete().eq("entity_type", entityType).eq("entity_id", entityId);
  if (deleteError) throw new Error(deleteError.message);
  if (desired.length) {
    const { error } = await client!.from("media_usages").insert(desired.map(({ asset, fieldName }) => ({ asset_id: asset.id, entity_type: entityType, entity_id: entityId, field_name: fieldName })));
    if (error) throw new Error(error.message);
    await client!.from("media_assets").update({ deleted_at: null }).in("id", desired.map(({ asset }) => asset.id));
  }
  const { data: orphanRows, error: orphanError } = await client!.from("media_assets").select("id,media_usages(id)").is("deleted_at", null);
  if (orphanError) throw new Error(orphanError.message);
  const orphanIds = (orphanRows || []).filter((row: { media_usages?: unknown[] }) => !row.media_usages?.length).map((row: { id: string }) => row.id);
  if (orphanIds.length) await client!.from("media_assets").update({ deleted_at: new Date().toISOString() }).in("id", orphanIds);
}

export async function moveMediaAssetToTrash(id: string) {
  const asset = (await listMediaAssets({ includeTrash: true })).find((item) => item.id === id);
  if (!asset) throw new Error("Recurso no encontrado.");
  if (asset.usage_count) throw new Error("El recurso sigue en uso y no puede enviarse a la papelera.");
  const deletedAt = new Date().toISOString();
  if (usesMediaMock()) { const store = await readStore(); const target = store.assets.find((item) => item.id === id)!; target.deleted_at = deletedAt; await writeStore(store); return; }
  const client = createServiceSupabaseClient(); const { error } = await client!.from("media_assets").update({ deleted_at: deletedAt }).eq("id", id); if (error) throw new Error(error.message);
}

export async function purgeExpiredMediaAssets(force = false) {
  const assets = await listMediaAssets({ includeTrash: true });
  const newlyOrphaned = assets.filter((asset) => !asset.usage_count && !asset.deleted_at);
  if (newlyOrphaned.length) {
    const trashedAt = new Date().toISOString();
    if (usesMediaMock()) {
      const store = await readStore();
      store.assets.forEach((asset) => { if (newlyOrphaned.some((item) => item.id === asset.id)) asset.deleted_at = trashedAt; });
      await writeStore(store);
    } else {
      const client = createServiceSupabaseClient();
      const { error } = await client!.from("media_assets").update({ deleted_at: trashedAt }).in("id", newlyOrphaned.map((asset) => asset.id));
      if (error) throw new Error(error.message);
    }
  }
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const targets = assets.filter((asset) => !asset.usage_count && asset.deleted_at && (force || Date.parse(asset.deleted_at) <= cutoff));
  const storage = getMediaStorageAdapter();
  for (const asset of targets) {
    const removed = await storage.delete(asset.storage_path);
    if (!removed) throw new Error(`No se eliminó metadata: falta el archivo físico ${asset.storage_path}.`);
  }
  if (!targets.length) return 0;
  const ids = targets.map((asset) => asset.id);
  if (usesMediaMock()) { const store = await readStore(); store.assets = store.assets.filter((asset) => !ids.includes(asset.id)); store.usages = store.usages.filter((usage) => !ids.includes(usage.asset_id)); await writeStore(store); }
  else { const client = createServiceSupabaseClient(); const { error } = await client!.from("media_assets").delete().in("id", ids); if (error) throw new Error(error.message); }
  return targets.length;
}
