"use client";

import { categories, catalogFileFeatures, catalogStyles, invitationTypes } from "@/lib/catalog-taxonomy";
import type { CatalogSample } from "@/types/invitations";
import { MediaField } from "./media-field";
import styles from "./catalog-samples-editor.module.css";

type Props = { samples: CatalogSample[]; onChange: (samples: CatalogSample[]) => void };
type FileType = CatalogSample["invitation_type"];
const fileTypes = invitationTypes.slice(0, 3);

export function CatalogSamplesEditor({ samples, onChange }: Props) {
  function patch(index: number, update: Partial<CatalogSample>) {
    onChange(samples.map((sample, current) => current === index ? { ...sample, ...update } : sample));
  }
  function add() {
    onChange([...samples, {
      id: crypto.randomUUID(), invitation_type: "imagen-esencial", card_title: "", card_description: "",
      category: "", subcategory: "", styles: [], feature_tags: [], preview_url: "", asset_url: "",
      published: false, created_at: new Date().toISOString(),
    }]);
  }
  return <section className={styles.panel}>
    <div className={styles.heading}><div><p className={styles.eyebrow}>CATÁLOGO DE ARCHIVOS</p><h3>Muestras de imagen, PDF y video</h3><p>Sube el material terminado en tu computadora. Aquí sólo editas su ficha pública; los demos web permanecen en Demos.</p></div><button type="button" onClick={add}>+ Nueva muestra</button></div>
    {!samples.length && <p className={styles.empty}>Todavía no hay muestras de archivo.</p>}
    {samples.map((sample, index) => {
      const category = categories.find((item) => item.id === sample.category);
      const required = sample.invitation_type === "imagen-esencial" ? ".avif" : sample.invitation_type === "interactiva" ? ".pdf" : ".webm";
      return <div className={styles.card} key={sample.id}>
        <div className={styles.cardHead}><strong>{sample.card_title || `Muestra ${index + 1}`}</strong><button type="button" onClick={() => onChange(samples.filter((_, current) => current !== index))}>Quitar</button></div>
        <div className={styles.grid}>
          <label><span>Tipo de invitación</span><select value={sample.invitation_type} onChange={(event) => patch(index, { invitation_type: event.target.value as FileType, asset_url: "", preview_url: "", feature_tags: [] })}>{fileTypes.map((type) => <option key={type.slug} value={type.slug}>{type.label}</option>)}</select></label>
          <label><span>Título de la tarjeta</span><input value={sample.card_title} onChange={(event) => patch(index, { card_title: event.target.value })} placeholder="Aventura bajo el mar" /></label>
          <label className={styles.wide}><span>Descripción de la tarjeta</span><input value={sample.card_description} onChange={(event) => patch(index, { card_description: event.target.value })} placeholder="Texto breve para las muestras" /></label>
          <label><span>Categoría</span><select value={sample.category} onChange={(event) => patch(index, { category: event.target.value, subcategory: "" })}><option value="">Selecciona</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <label><span>Subcategoría</span><select value={sample.subcategory} onChange={(event) => patch(index, { subcategory: event.target.value })}><option value="">Selecciona</option>{category?.subcategories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <fieldset className={styles.wide}><legend>Estilos</legend><div className={styles.options}>{catalogStyles.map((style) => <label key={style}><input type="checkbox" checked={sample.styles.includes(style)} onChange={(event) => patch(index, { styles: event.target.checked ? [...sample.styles, style] : sample.styles.filter((item) => item !== style) })} />{style}</label>)}</div></fieldset>
          <fieldset className={styles.wide}><legend>Etiquetas que aparecen en la tarjeta</legend><div className={styles.options}>{catalogFileFeatures[sample.invitation_type].map((tag) => <label key={tag}><input type="checkbox" checked={sample.feature_tags.includes(tag)} onChange={(event) => patch(index, { feature_tags: event.target.checked ? [...sample.feature_tags, tag] : sample.feature_tags.filter((item) => item !== tag) })} />{tag}</label>)}</div></fieldset>
          {sample.invitation_type !== "imagen-esencial" && <div className={styles.wide}><MediaField label="Imagen estática para tarjeta y vista previa" accept="image/jpeg,image/png,image/webp,image/avif" value={sample.preview_url} onChange={(value) => patch(index, { preview_url: value })} /></div>}
          <div className={styles.wide}><MediaField label={sample.invitation_type === "imagen-esencial" ? "Imagen AVIF final (también se usa en la tarjeta y vista previa)" : sample.invitation_type === "interactiva" ? "Documento PDF final" : "Video WebM final"} accept={required} invitationType={sample.invitation_type} value={sample.asset_url} onChange={(value) => patch(index, { asset_url: value, ...(sample.invitation_type === "imagen-esencial" ? { preview_url: value } : {}) })} /></div>
          <label className={styles.publish}><input type="checkbox" checked={sample.published} onChange={(event) => patch(index, { published: event.target.checked })} /><span>Visible en Muestras</span></label>
        </div>
      </div>;
    })}
    <p className={styles.hint}>Guarda los cambios del sitio web para aplicar las muestras. Las fichas incompletas pueden permanecer ocultas.</p>
  </section>;
}
