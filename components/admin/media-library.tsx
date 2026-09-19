"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { MediaAssetType, MediaAssetWithUsage } from "@/types/media";
import { invitationTypes, type InvitationTypeSlug } from "@/lib/catalog-taxonomy";
import styles from "./media-library.module.css";

type Asset = MediaAssetWithUsage & { url: string };

export function MediaLibrary() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [query, setQuery] = useState("");
  const [trash, setTrash] = useState(false);
  const [message, setMessage] = useState("");
  const [product, setProduct] = useState<InvitationTypeSlug>("web-premium");
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (typeFilter) params.set("type", typeFilter);
    if (query) params.set("q", query);
    if (trash) params.set("trash", "1");
    const response = await fetch(`/api/admin/media?${params}`);
    const payload = (await response.json()) as { assets?: Asset[]; error?: string };
    if (response.ok) setAssets(payload.assets || []);
    else setMessage(payload.error || "No se pudo cargar la biblioteca.");
  }, [typeFilter, query, trash]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 150);
    return () => clearTimeout(timer);
  }, [load]);

  async function handleAction(id: string, action: "trash" | "restore") {
    const response = await fetch("/api/admin/media", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    const payload = (await response.json()) as { error?: string };
    setMessage(
      response.ok
        ? action === "trash"
          ? "Recurso movido a la papelera."
          : "Recurso restaurado."
        : payload.error || "No se pudo actualizar."
    );
    await load();
  }

  async function handleUpload(file?: File) {
    if (!file) return;
    setUploading(true);
    setMessage("");
    const body = new FormData();
    body.append("file", file);
    body.append("invitationType", product);
    const response = await fetch("/api/admin/site/media", { method: "POST", body });
    const payload = (await response.json()) as { error?: string; deduplicated?: boolean };
    setMessage(
      response.ok
        ? payload.deduplicated
          ? "El archivo ya existía en el servidor; se reutilizó el recurso."
          : "¡Archivo subido exitosamente a la biblioteca!"
        : payload.error || "No se pudo subir."
    );
    setUploading(false);
    if (response.ok) await load();
  }

  async function handleCopyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("URL copiada al portapapeles");
      setTimeout(() => setMessage(""), 2500);
    } catch {
      setMessage("No se pudo copiar la URL");
    }
  }

  const counts = useMemo(() => {
    const images = assets.filter((a) => ["image", "svg"].includes(a.asset_type)).length;
    const videos = assets.filter((a) => a.asset_type === "video").length;
    const inTrash = assets.filter((a) => Boolean(a.deleted_at)).length;
    return { total: assets.length, images, videos, inTrash };
  }, [assets]);

  return (
    <div className={styles.container}>
      {/* Top Stats Cards */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{counts.total}</span>
            <span className={styles.statLabel}>Total Archivos</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(59, 130, 246, 0.2)", color: "#60a5fa" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{counts.images}</span>
            <span className={styles.statLabel}>Imágenes y SVGs</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(168, 85, 247, 0.2)", color: "#c084fc" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{counts.videos}</span>
            <span className={styles.statLabel}>Videos de Fondo</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(239, 68, 68, 0.2)", color: "#f87171" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{counts.inTrash}</span>
            <span className={styles.statLabel}>En Papelera</span>
          </div>
        </div>
      </div>

      {/* Upload Panel Card */}
      <div className={styles.uploadCard}>
        <div className={styles.uploadHeader}>
          <div className={styles.uploadTitleGroup}>
            <div className={styles.statIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div>
              <h3 className={styles.uploadTitle}>Subir Nuevo Archivo Multimedia</h3>
              <p className={styles.uploadSubtitle}>Formatos permitidos: JPG, PNG, WEBP, AVIF, SVG, MP4, WEBM</p>
            </div>
          </div>

          <div className={styles.uploadControls}>
            <select
              className={styles.selectProduct}
              value={product}
              onChange={(e) => setProduct(e.target.value as InvitationTypeSlug)}
            >
              {invitationTypes.map((item) => (
                <option value={item.slug} key={item.slug}>
                  Asignar a: {item.label}
                </option>
              ))}
            </select>

            <label className={styles.btnUploadLabel}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>{uploading ? "Subiendo..." : "Seleccionar y Subir Archivo"}</span>
              <input
                type="file"
                className={styles.btnUploadInput}
                disabled={uploading}
                accept=".jpg,.jpeg,.png,.webp,.avif,.svg,.pdf,.mp4,.webm"
                onChange={(event) => void handleUpload(event.target.files?.[0])}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre de archivo..."
          />
        </div>

        <div className={styles.filterTabs}>
          {[
            { id: "", label: "Todos" },
            { id: "image", label: "Imágenes" },
            { id: "video", label: "Videos" },
            { id: "svg", label: "SVGs" },
          ].map((tab) => (
            <button
              type="button"
              key={tab.id}
              className={`${styles.filterTab} ${typeFilter === tab.id ? styles.filterTabActive : ""}`}
              onClick={() => setTypeFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <label className={styles.trashToggle}>
          <input
            type="checkbox"
            className={styles.trashToggleInput}
            checked={trash}
            onChange={(e) => setTrash(e.target.checked)}
          />
          <span>Mostrar Papelera</span>
        </label>
      </div>

      {message ? (
        <div style={{ padding: "10px 16px", borderRadius: "12px", background: "rgba(124, 58, 237, 0.15)", color: "#c4b5fd", fontSize: "0.88rem", border: "1px solid rgba(167, 139, 250, 0.3)" }}>
          {message}
        </div>
      ) : null}

      {/* Asset Cards Grid */}
      <div className={styles.grid}>
        {assets.length ? (
          assets.map((asset) => (
            <div key={asset.id} className={styles.assetCard}>
              <div className={styles.previewContainer}>
                {["image", "svg"].includes(asset.asset_type) ? (
                  <img src={asset.url} alt={asset.original_filename} className={styles.previewImage} />
                ) : asset.asset_type === "video" ? (
                  <video src={asset.url} muted controls preload="metadata" className={styles.previewVideo} />
                ) : (
                  <span style={{ color: "#a8adba", fontWeight: 700 }}>{asset.asset_type.toUpperCase()}</span>
                )}
                <span className={styles.typeBadge}>{asset.asset_type}</span>
                {asset.usage_count > 0 ? (
                  <span className={styles.usageBadge}>{asset.usage_count} usos</span>
                ) : null}
              </div>

              <div className={styles.assetBody}>
                <h4 className={styles.assetFilename} title={asset.original_filename}>
                  {asset.original_filename}
                </h4>
                <p className={styles.assetMeta}>
                  {(asset.size_bytes / 1024 / 1024).toFixed(2)} MB · {new Date(asset.created_at).toLocaleDateString("es-MX")}
                </p>

                <div className={styles.assetActions}>
                  <button
                    type="button"
                    className={styles.btnCopyUrl}
                    onClick={() => void handleCopyUrl(asset.url)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>Copiar URL</span>
                  </button>

                  {asset.deleted_at ? (
                    <button
                      type="button"
                      className={styles.btnRestore}
                      onClick={() => void handleAction(asset.id, "restore")}
                    >
                      Restaurar
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.btnTrash}
                      disabled={asset.usage_count > 0}
                      title={asset.usage_count ? "El recurso está en uso activo" : "Mover a la papelera"}
                      onClick={() => void handleAction(asset.id, "trash")}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      <span>Eliminar</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" style={{ marginBottom: "12px" }}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <h3 style={{ color: "#ffffff", margin: "0 0 6px" }}>No se encontraron archivos</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>
              Sube tus imágenes o videos en el panel superior para utilizarlos en tus invitaciones.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
