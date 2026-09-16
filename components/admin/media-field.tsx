"use client";
import { useEffect, useState } from "react";
import type { InvitationTypeSlug } from "@/lib/catalog-taxonomy";
import type { MediaAssetWithUsage } from "@/types/media";

type LibraryAsset = MediaAssetWithUsage & { url: string };

export function MediaField({ label, value, accept, invitationType, onChange }: { label: string; value?: string; accept: string; invitationType?: InvitationTypeSlug; onChange: (value: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [assets, setAssets] = useState<LibraryAsset[]>([]);
  const [search, setSearch] = useState("");
  async function upload(file?: File) {
    if (!file) return;
    setUploading(true); setError("");
    try {
      const body = new FormData(); body.append("file", file); if (invitationType) body.append("invitationType", invitationType);
      const response = await fetch("/api/admin/site/media", { method: "POST", body });
      const payload = await response.json() as { url?: string; error?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error || "No se pudo subir el archivo.");
      onChange(payload.url);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo subir el archivo."); }
    finally { setUploading(false); }
  }
  useEffect(() => {
    if (!libraryOpen) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const response = await fetch(`/api/admin/media?q=${encodeURIComponent(search)}`, { signal: controller.signal });
      const payload = await response.json() as { assets?: LibraryAsset[]; error?: string };
      if (response.ok) setAssets(payload.assets || []); else setError(payload.error || "No se pudo abrir la biblioteca.");
    }, 150);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [libraryOpen, search]);
  const compatible = assets.filter((asset) => accept.includes("video") ? asset.asset_type === "video" : accept.includes("pdf") ? asset.asset_type === "pdf" : ["image", "svg"].includes(asset.asset_type));
  const isVideo = value && /\.(mp4|webm)(?:\?|$)/i.test(value);
  const isPdf = value && /\.pdf(?:\?|$)/i.test(value);
  return <div className="field-wide site-media-field">
    <span>{label}</span>
    <div className="site-media-field__row">
      <input value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder="Selecciona un recurso o carga un archivo" />
      <label className="button-secondary site-upload-button">{uploading ? "Subiendo…" : "Subir archivo"}<input type="file" accept={accept} disabled={uploading} onChange={(event) => void upload(event.target.files?.[0])} /></label>
      <button type="button" className="button-secondary" onClick={() => setLibraryOpen(true)}>Elegir de biblioteca</button>
    </div>
    {error ? <small className="error-text">{error}</small> : null}
    {value ? <span className="site-media-preview">{isVideo ? <video src={value} muted playsInline controls /> : isPdf ? <a href={value} target="_blank" rel="noreferrer">Abrir PDF</a> : <img src={value} alt="Vista previa" />}</span> : null}
    {libraryOpen ? <div className="admin-media-picker" role="dialog" aria-modal="true" aria-label="Biblioteca multimedia"><div className="admin-media-picker__panel"><header><strong>Biblioteca multimedia</strong><button type="button" onClick={() => setLibraryOpen(false)} aria-label="Cerrar">×</button></header><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre" /><div className="admin-media-picker__grid">{compatible.map((asset) => <button type="button" key={asset.id} onClick={() => { onChange(asset.url); setLibraryOpen(false); }}>{["image","svg"].includes(asset.asset_type) ? <img src={asset.url} alt="" /> : <span>{asset.asset_type.toUpperCase()}</span>}<small>{asset.original_filename}</small><small>{asset.usage_count} usos</small></button>)}</div></div></div> : null}
  </div>;
}
