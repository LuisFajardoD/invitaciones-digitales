# Arquitectura de estilos de Gloobi

Auditoría: 9 de septiembre de 2026. Se conserva la composición existente.

## Dónde cambiar cada cosa

| Superficie | Entrada | Estilos |
|---|---|---|
| HOME | `public/index.html` (`/` redirige aquí) | AIOR `style.css`, `gloobi-hero.css` |
| About | `public/about.html` | anteriores + `about-gloobi.css` |
| FAQ | `public/faq.html` | anteriores + CSS específico FAQ |
| Contacto | `public/contact.html` | estilos públicos y formulario |
| Catálogo | `app/invitaciones/page.tsx`, `InvitationCatalog.tsx` | `InvitationCatalog.module.css`, `CatalogChrome.module.css` |
| CRM | `components/admin/*`, `src/crm/*` | `.app-admin` en `src/crm/admin.css` |
| Viewer | `app/i/*`, `src/crm/*` | `.app-viewer` en `src/crm/viewer.css` |
| Tarjeta animada | `public/mensaje-card-original.html` | CSS dentro del iframe, aislado del padre |

`app/layout.tsx` carga `app/globals.css` y `shared/ui/*`; estas hojas no entran en los documentos HTML estáticos. Los estilos AIOR tampoco se importan al CRM. La convivencia es por rutas/documentos, no una cascada única de todas las plantillas.

## Tema y primer paint

Clave persistida: `site-theme-mode`; HTML conserva lectura compatible de `gloobi-site-theme`. Los HTML ahora leen la preferencia en head antes de sus stylesheets, aplican `data-theme` y `data-site-theme`, y sincronizan las clases del body al abrirlo. Los controles posteriores mantienen sus manejadores existentes.

React usa `components/admin/use-site-theme.ts`. Se agregó una barrera de inicialización para no escribir el dark inicial sobre una preferencia guardada; almacenamiento bloqueado deja de lanzar excepciones. Sigue pendiente unificar el primer paint SSR de todas las superficies React sin romper hidratación ni las preferencias específicas del viewer.

## Fondo y superficies

`.gloobi-global-bg` es fijo al viewport, una instancia por página inspeccionada. Contiene cinco gradientes animados y una burbuja de interacción; responsive oculta los elementos 5 y 4 progresivamente. `.gloobi-global-bg__glass` utiliza color translúcido y sombras internas, no backdrop blur de pantalla completa. El filtro SVG goo + blur de los gradientes sigue siendo costoso y se conserva por identidad visual.

El hero tiene además su propia composición cromática; no se eliminó como supuesto duplicado porque cumple otra función visual. Sus animaciones CSS se pausan fuera de viewport. Namespaces importados: `.gloobi-celebration-*`, `.gloobi-comparison-*`, `.gloobi-process-*`, `.gloobi-global-*`.

## Footer

El footer es oscuro en ambos temas. `gloobi-hero.css` fija contexto local `--footer-text-primary: #fff` y `--footer-text-secondary: #d1c9df` para título, columnas, enlaces, copyright, redes, input y placeholder. Selectores específicos vencen los overrides light heredados que pintaban letras oscuras sobre la tarjeta oscura. El catálogo tiene reglas equivalentes dentro de su módulo; no se añadieron enlaces legales retirados anteriormente.

## Deuda y reglas

`gloobi-hero.css` tenía cientos de `!important` y varias capas históricas de overrides. No se purgó automáticamente: JS y páginas secundarias dependen de clases dinámicas. Se eliminó únicamente la pareja duplicada e idéntica `.subcategories` del módulo del catálogo. No se borraron assets originales ni hojas vendor.

Para nuevas secciones: namespace Gloobi propio o CSS Module; no introducir `.card`, `.title`, `.container` globales. Evitar `transition: all`; limitar propiedades después de revisar los estados hover. No animar layout si transform/opacity reproduce el efecto. No extender variables de texto light al footer. Mantener dimensiones/aspect-ratio de media y cargar solo lo cercano al viewport.
