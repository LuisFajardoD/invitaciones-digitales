import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { buildMediaUrl } from "@/lib/media-config";
import { listMediaAssets, moveMediaAssetToTrash, purgeExpiredMediaAssets, restoreMediaAsset } from "@/lib/media-repository";
import type { MediaAssetType } from "@/types/media";

export const runtime = "nodejs";
export async function GET(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const type = ["image","video","pdf","svg","other"].includes(params.get("type") || "") ? params.get("type") as MediaAssetType : undefined;
  const trash = params.get("trash") === "1";
  const assets = await listMediaAssets({ type, search: params.get("q") || "", includeTrash: trash });
  const visibleAssets = trash ? assets.filter((asset) => Boolean(asset.deleted_at)) : assets;
  return NextResponse.json({ assets: visibleAssets.map((asset) => ({ ...asset, url: buildMediaUrl(asset.public_path) })) });
}
export async function PATCH(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const body = await request.json() as { id?: string; action?: "trash" | "restore" };
  try { if (!body.id) throw new Error("Falta el recurso."); if (body.action === "restore") await restoreMediaAsset(body.id); else await moveMediaAssetToTrash(body.id); return NextResponse.json({ ok: true }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo actualizar." }, { status: 400 }); }
}
export async function DELETE(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  try {
    const removed = await purgeExpiredMediaAssets(new URL(request.url).searchParams.get("force") === "1");
    return NextResponse.json({ ok: true, removed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo limpiar la biblioteca.";
    console.error("[media] Falló la purga.", { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
