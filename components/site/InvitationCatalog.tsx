"use client";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useSiteTheme } from "@/components/admin/use-site-theme";
import { categories, catalogStyles, DEFAULT_INVITATION_TYPE, invitationTypes, slugify, type InvitationTypeSlug } from "@/lib/catalog-taxonomy";
import type { CatalogItem } from "@/lib/invitation-catalog";
import type { SiteContentPage } from "@/types/invitations";
import { CatalogDialog } from "./CatalogDialog";
import { WaterBackground } from "./WaterBackground";
import { railHtml, footerHtml } from "./catalog-chrome";
import chrome from "./CatalogChrome.module.css";
import styles from "./InvitationCatalog.module.css";
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
type Filters = { category: string; subcategory: string; invitationType: InvitationTypeSlug; q: string; styles: string[]; sort: string };
const empty: Filters = { category: "", subcategory: "", invitationType: DEFAULT_INVITATION_TYPE, q: "", styles: [], sort: "featured" };
function readFilters(): Filters {
  const p = new URLSearchParams(window.location.search);
  const category = categories.find(c => c.id === p.get("categoria"));
  const invitationType = invitationTypes.find(type => type.slug === p.get("tipo"))?.slug || DEFAULT_INVITATION_TYPE;
  const styles = p.getAll("estilo").map(value => catalogStyles.find(style => style === value || slugify(style) === value)).filter((style): style is string => Boolean(style));
  return { category: category?.id || "", subcategory: category?.subcategories.find(s => slugify(s) === p.get("subcategoria")) || "", invitationType, q: p.get("q") || "", styles, sort: ["recent", "az"].includes(p.get("orden") || "") ? p.get("orden")! : "featured" };
}
export function InvitationCatalog({ items, page }: { items: CatalogItem[]; page: SiteContentPage }) {
  const { themeMode, toggleTheme } = useSiteTheme();
  const [filters, setFilters] = useState<Filters>(empty);
  const [search, setSearch] = useState("");
  const [ready, setReady] = useState(false);
  const [limit, setLimit] = useState(10);
  const [preview, setPreview] = useState<CatalogItem | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const rail = useRef<HTMLDivElement>(null);
  const footer = useRef<HTMLDivElement>(null);
  useEffect(() => { const sync = () => { const next = readFilters(); const params = new URLSearchParams(window.location.search); if (!invitationTypes.some(type => type.slug === params.get("tipo"))) { params.set("tipo", next.invitationType); window.history.replaceState(null, "", `${window.location.pathname}?${params}`); } setFilters(next); setSearch(next.q); setLimit(10); }; sync(); setReady(true); window.addEventListener("popstate", sync); return () => window.removeEventListener("popstate", sync); }, []);
  useEffect(() => { const button = rail.current?.querySelector("button"); const nav = rail.current?.querySelector(".gloobi-rail-logo-menu"); button?.setAttribute("aria-expanded", String(menu)); nav?.classList.toggle("is-open", menu); }, [menu]);
  function update(patch: Partial<Filters>) {
    const next = { ...filters, ...patch };
    const p = new URLSearchParams();
    if (next.category) p.set("categoria", next.category);
    if (next.subcategory) p.set("subcategoria", slugify(next.subcategory));
    p.set("tipo", next.invitationType);
    if (next.q) p.set("q", next.q);
    next.styles.forEach(s => p.append("estilo", slugify(s)));
    if (next.sort !== "featured") p.set("orden", next.sort);
    window.history.pushState(null, "", `${window.location.pathname}${p.size ? `?${p}` : ""}`);
    setFilters(next); setLimit(10);
  }
  useEffect(() => { if (!ready || search.trim() === filters.q) return; const timer = setTimeout(() => update({ q: search.trim() }), 250); return () => clearTimeout(timer); }, [search, filters, ready]);
  const itemsForType = useMemo(() => items.filter(item => item.invitationTypes.includes(filters.invitationType)), [items, filters.invitationType]);
  const availableCategories = useMemo(() => categories.filter(option => itemsForType.some(item => item.category === option.id)), [itemsForType]);
  const category = categories.find(c => c.id === filters.category);
  const itemsForStyle = useMemo(() => itemsForType.filter(item => (!filters.category || item.category === filters.category) && (!filters.subcategory || item.subcategory === filters.subcategory)), [itemsForType, filters.category, filters.subcategory]);
  const availableStyles = useMemo(() => catalogStyles.filter(style => itemsForStyle.some(item => item.styles.includes(style))), [itemsForStyle]);
  const results = useMemo(() => itemsForType.filter(item => (!filters.category || item.category === filters.category) && (!filters.subcategory || item.subcategory === filters.subcategory) && (!filters.styles.length || filters.styles.some(s => item.styles.includes(s))) && normalize([item.title, item.description, categories.find(c => c.id === item.category)?.label, item.subcategory, ...item.styles, ...item.features].join(" ")).includes(normalize(filters.q))).sort((a,b) => filters.sort === "az" ? a.title.localeCompare(b.title, "es") : filters.sort === "recent" ? Date.parse(b.createdAt) - Date.parse(a.createdAt) : a.featuredOrder - b.featuredOrder), [itemsForType, filters]);
  const clear = () => { setSearch(""); update({ ...empty, invitationType: filters.invitationType }); };
  const toggleStyle = (value: string) => update({ styles: filters.styles.includes(value) ? filters.styles.filter(style => style !== value) : [...filters.styles, value] });
  const selectInvitationType = (invitationType: InvitationTypeSlug) => update({ invitationType, category: "", subcategory: "", styles: [] });
  const active = Boolean(filters.category || filters.q || filters.styles.length);
  const controls = <div className={styles.filterGroups}>
    <fieldset><legend>Tipo de invitación</legend>{invitationTypes.map(type => <label key={type.slug}><input type="radio" name={drawer ? "mobile-invitation-type" : "invitation-type"} checked={filters.invitationType === type.slug} onChange={() => selectInvitationType(type.slug)} />{type.label}</label>)}</fieldset>
    <fieldset><legend>Categoría</legend>{[{id: "", label: "Todas"}, ...availableCategories].map(c => <label key={c.id}><input type="radio" name={drawer ? "mobile-category" : "category"} checked={filters.category === c.id} onChange={() => update({category: c.id, subcategory: "", styles: []})} />{c.label}</label>)}{category && <div className={styles.subcategories} role="group" aria-label="Subcategoría"><strong>Subcategoría</strong><label><input type="radio" name={drawer ? "mobile-subcategory" : "subcategory"} checked={!filters.subcategory} onChange={() => update({subcategory: "", styles: []})} />Todas</label>{category.subcategories.filter(subcategory => itemsForType.some(item => item.category === category.id && item.subcategory === subcategory)).map(s => <label key={s}><input type="radio" name={drawer ? "mobile-subcategory" : "subcategory"} checked={filters.subcategory === s} onChange={() => update({subcategory: s, styles: []})} />{s}</label>)}</div>}</fieldset>
    <fieldset><legend>Estilo</legend><p className={styles.filterHint}>Sin seleccionar se muestran todos. Varias opciones amplían los resultados.</p>{availableStyles.map(s => <label key={s}><input type="checkbox" checked={filters.styles.includes(s)} onChange={() => toggleStyle(s)} />{s}</label>)}</fieldset>
    <button onClick={clear}>Limpiar filtros</button>
  </div>;
  const heroContent = page.sections.find((section) => section.id === "hero");
  const backgroundContent = page.sections.find((section) => section.id === "background");
  const filtersContent = page.sections.find((section) => section.id === "filters");
  const footerContent = page.sections.find((section) => section.id === "footer");
  useEffect(() => {
    const root = footer.current;
    if (!root || !footerContent) return;
    root.hidden = footerContent.enabled === false;
    const title = root.querySelector<HTMLElement>("#footer .footer-top .box-title");
    const description = root.querySelector<HTMLElement>("#footer .about-text");
    const footerNode = root.querySelector<HTMLElement>("#footer");
    if (title && footerContent.title) title.textContent = footerContent.title;
    if (description && footerContent.description) description.textContent = footerContent.description;
    if (footerNode && footerContent.image_url) footerNode.style.backgroundImage = `url("${footerContent.image_url}")`;
  }, [footerContent]);
  const catalogStyle = {
    "--catalog-bg-dark": `url("${backgroundContent?.background_dark_url || "/assets/compartidos/fondos/fondo-global-oscuro.avif"}")`,
    "--catalog-bg-light": `url("${backgroundContent?.background_light_url || "/assets/compartidos/fondos/fondo-global-claro.avif"}")`,
  } as CSSProperties;
  return <div className={`${styles.root} ${chrome.shell}`} data-theme={themeMode} style={catalogStyle}>
    <div className="gloobi-global-bg" aria-hidden="true">
      <WaterBackground darkSource={backgroundContent?.background_dark_url} lightSource={backgroundContent?.background_light_url} />
      <div className="gloobi-global-bg__glass" />
    </div>
    <div ref={rail} onClick={e => { if ((e.target as Element).closest("button")) setMenu(!menu); }} onKeyDown={e => { if(e.key === "Escape") setMenu(false); }} dangerouslySetInnerHTML={{ __html: railHtml }} />
    <main className={styles.main}>
      <div className={styles.topbar}><a href="/" aria-label="Gloobi, inicio"><img src="/assets/compartidos/marca/logo-gloobi.svg" alt="Gloobi" width="112" height="46" /></a><button onClick={toggleTheme} aria-label={themeMode === "dark" ? "Activar modo claro" : "Activar modo oscuro"}>{themeMode === "dark" ? "☀" : "☾"}</button></div>
      <header className={styles.heading} hidden={heroContent?.enabled === false}><nav aria-label="Breadcrumb"><a href="/">Inicio</a><span> / </span> Invitaciones</nav><p className={styles.eyebrow}>{heroContent?.eyebrow}</p><h1>{heroContent?.title}</h1><p>{heroContent?.description}</p></header>
      <nav className={styles.quickTypes} aria-label="Tipos de invitación">
        {invitationTypes.map(type => <button key={type.slug} className={filters.invitationType === type.slug ? styles.quickTypeActive : ""} onClick={() => selectInvitationType(type.slug)}>{type.label}</button>)}
      </nav>
      <nav className={styles.quickCategories} aria-label="Categorías rápidas">
        {[{id: "", label: "Todas"}, ...availableCategories].map(item => <button key={item.id || "all"} className={filters.category === item.id ? styles.quickCategoryActive : ""} onClick={() => update({ category: item.id, subcategory: "", styles: [] })}>{item.label}</button>)}
      </nav>
      <div className={styles.layout} hidden={filtersContent?.enabled === false}>
        <aside className={styles.sidebar} aria-label="Filtros de invitaciones">{!drawer && controls}</aside>
        <section className={styles.results} aria-label="Catálogo de invitaciones">
          <div className={styles.toolbar}><label className={styles.search}><span aria-hidden="true">⌕</span><input aria-label="Buscar invitaciones" value={search} onChange={e => setSearch(e.target.value)} placeholder={filtersContent?.description || "Buscar por nombre, temática o estilo..."} type="search" /></label><button className={styles.mobileFilters} onClick={() => setDrawer(true)}>{filtersContent?.title || "Filtros"}</button></div>
          <div className={styles.resultBar}><span role="status" aria-live="polite">{results.length} {results.length === 1 ? "invitación" : "invitaciones"}</span><label>Ordenar por <select value={filters.sort} onChange={e => update({sort: e.target.value})}><option value="featured">Destacadas</option><option value="recent">Más recientes</option><option value="az">A–Z</option></select></label></div>
          {active && <div className={styles.chips}>{category && <button onClick={() => update({category: "", subcategory: "", styles: []})}>{category.label} ×</button>}{filters.subcategory && <button onClick={() => update({subcategory: "", styles: []})}>{filters.subcategory} ×</button>}{filters.q && <button onClick={() => {setSearch(""); update({q: ""});}}>“{filters.q}” ×</button>}{filters.styles.map(s => <button key={s} onClick={() => toggleStyle(s)}>{s} ×</button>)}<button onClick={clear}>Limpiar filtros</button></div>}
          <div className={styles.grid}>{results.slice(0,limit).map((item,index) => <article className={styles.card} key={item.id}>
            <button className={styles.media} onClick={() => setPreview(item)} aria-label={`Vista previa de ${item.title}`}>{item.thumbnail ? <img src={item.thumbnail} alt="" loading={index < 4 ? "eager" : "lazy"} /> : null}<span className={styles.previewButton}>Vista previa</span></button>
            <div className={styles.cardCopy}><span className={styles.category}>{categories.find(c => c.id === item.category)?.label || "Invitación digital"}</span><h2>{item.title}</h2><p>{item.subcategory || item.description}</p><div className={styles.features}>{item.features.slice(0,3).map(f => <span key={f} title={f}>✓ {f}</span>)}{item.features.length > 3 && <span title={item.features.slice(3).join(" · ")}>+{item.features.length - 3}</span>}</div>{item.showDemo ? <a className={styles.demoLink} href={item.demoUrl} target={item.invitationTypes[0].startsWith("web-") ? undefined : "_blank"} rel={item.invitationTypes[0].startsWith("web-") ? undefined : "noreferrer"}>{item.invitationTypes[0] === "interactiva" ? "Ver PDF" : item.invitationTypes[0] === "video-invitacion" ? "Ver video" : "Ver demo"} <span aria-hidden="true">↗</span></a> : null}</div>
          </article>)}</div>
          {!results.length && <div className={styles.empty}><span aria-hidden="true">✧</span><h2>No encontramos invitaciones con esos filtros</h2><p>Prueba cambiando alguna opción o limpia los filtros para ver más diseños.</p><button onClick={clear}>Limpiar filtros</button></div>}
          {results.length > limit && <div className={styles.loadMore}><button onClick={() => setLimit(n => n+10)}>Cargar más</button><p>Mostrando {Math.min(limit,results.length)} de {results.length}</p></div>}
        </section>
      </div>
    </main>
    <div ref={footer} className={styles.footer} dangerouslySetInnerHTML={{__html: footerHtml}} />
    {preview && <CatalogDialog title={preview.title} onClose={() => setPreview(null)} fullScreen><div className={styles.previewScroll}>{preview.thumbnail ? <img src={preview.thumbnail} alt={`Vista previa completa de ${preview.title}`} /> : <p>Imagen de vista previa no disponible.</p>}</div></CatalogDialog>}
    {drawer && <CatalogDialog title="Filtros" drawer onClose={() => setDrawer(false)}><div className={styles.drawerScroll}>{controls}</div><footer className={styles.dialogActions}><button onClick={() => setDrawer(false)}>Ver {results.length} invitaciones</button></footer></CatalogDialog>}
  </div>;
}
