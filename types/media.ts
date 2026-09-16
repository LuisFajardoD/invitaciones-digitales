export type MediaAssetType = "image" | "video" | "pdf" | "svg" | "other";
export type MediaEntityType = "site" | "invitation" | "catalog" | "demo";

export interface MediaAsset {
  id: string;
  filename: string;
  original_filename: string;
  storage_path: string;
  public_path: string;
  mime_type: string;
  extension: string;
  size_bytes: number;
  sha256: string;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  asset_type: MediaAssetType;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MediaUsage {
  id: string;
  asset_id: string;
  entity_type: MediaEntityType;
  entity_id: string;
  field_name: string;
  created_at: string;
}

export interface MediaAssetWithUsage extends MediaAsset {
  usage_count: number;
  usages?: MediaUsage[];
}
