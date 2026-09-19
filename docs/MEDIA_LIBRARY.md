# Biblioteca Multimedia de Gloobi

## Alcance y auditoría

Antes de este cambio, `POST /api/admin/site/media` autenticaba al administrador, confiaba en el MIME declarado por el navegador, admitía imágenes/SVG/video hasta 30 MB, generaba un UUID y escribía directamente en `public/uploads/site`. No registraba metadata, hash, usos, reemplazos, papelera ni eliminación. En producción esa carpeta pertenece al checkout/build y su persistencia no estaba garantizada.

El repositorio sólo documenta un despliegue de **Hostinger Node.js Apps importado desde GitHub** (`npm ci`, `npm run build`, `npm run start`). No documenta el directorio real del checkout, `public_html`, aliases del servidor web ni qué ruta sobrevive a cada deploy. Por ello no se eligió una ruta de producción inventada.

Clasificación del contenido actual:

- `public/assets`, `public`, `public/img`, `public/logo-gloobi`: recursos técnicos o editoriales versionados; permanecen en Git.
- `public/uploads/site`: uploads previos del CRM. Se conservan intactos y no se migran automáticamente.
- `.mock-data/media.json`: metadata local de la biblioteca cuando Supabase no está configurado.
- Nuevos uploads: biblioteca deduplicada configurada mediante variables de entorno.

## Configuración

La metadata y el archivo físico son capas separadas. `MEDIA_METADATA_BACKEND` elige Supabase o el mock local; `MEDIA_BACKEND` elige el adaptador físico.

Variables centrales:

```env
MEDIA_BACKEND=local
MEDIA_STORAGE_PATH=
MEDIA_BASE_URL=
MEDIA_METADATA_BACKEND=

MEDIA_FTP_HOST=
MEDIA_FTP_PORT=21
MEDIA_FTP_USER=
MEDIA_FTP_PASSWORD=
MEDIA_FTP_ROOT=/public_html
MEDIA_FTP_SECURE=true
MEDIA_FTP_TLS_SERVERNAME=
MEDIA_FTP_TIMEOUT_MS=15000
MEDIA_FTP_RETRIES=2
```

### Backend local

Con `MEDIA_BACKEND=local`, en desarrollo se usa `public/uploads/media` y la URL `/uploads/media` cuando `MEDIA_STORAGE_PATH` y `MEDIA_BASE_URL` faltan. La metadata usa `.mock-data/media.json` salvo que `MEDIA_METADATA_BACKEND=supabase`. En producción, la ruta persistente y la URL pública son obligatorias; el endpoint falla antes de escribir dentro del deploy si faltan.

### Backend Hostinger

Con `MEDIA_BACKEND=hostinger`, el servidor Node de Gloobi abre una conexión FTP explícita con TLS, escribe en el sitio independiente de medios y devuelve URLs basadas en `MEDIA_BASE_URL`. El navegador nunca recibe usuario, contraseña ni conexión FTP. `media.gloobimx.com` sólo sirve archivos públicos; no necesita ejecutar Node.js.

Configuración prevista para contenido real:

```env
MEDIA_BACKEND=hostinger
MEDIA_METADATA_BACKEND=supabase
MEDIA_BASE_URL=https://media.gloobimx.com
MEDIA_FTP_HOST=ftp.media.gloobimx.com
MEDIA_FTP_PORT=21
MEDIA_FTP_USER=
MEDIA_FTP_PASSWORD=
MEDIA_FTP_ROOT=/
MEDIA_FTP_SECURE=true
MEDIA_FTP_TLS_SERVERNAME=
```

`MEDIA_FTP_PASSWORD` es un secreto exclusivo del servidor. No debe usar prefijo `NEXT_PUBLIC_`, guardarse en Supabase, imprimirse en logs ni entrar a Git. Las mismas variables se configuran en `.env.local` para localhost y en las variables de entorno de la aplicación `gloobimx.com` para producción. En esta cuenta concreta, `PWD` devuelve `/public_html`, por lo que ese es el `MEDIA_FTP_ROOT` correcto.

`MEDIA_FTP_TLS_SERVERNAME` sólo se usa cuando Hostinger entrega un hostname oficial distinto para validar el certificado TLS. No desactiva la validación: `rejectUnauthorized` permanece activo. `MEDIA_FTP_SECURE=false` está bloqueado salvo una habilitación deliberada mediante `MEDIA_FTP_ALLOW_INSECURE=true`; no debe utilizarse mientras el servidor admita `AUTH TLS`.

Para el backend local de Hostinger se debe configurar:

1. `MEDIA_STORAGE_PATH`: ruta absoluta persistente y escribible, fuera del checkout que reemplaza el deploy.
2. `MEDIA_BASE_URL`: URL pública que Hostinger sirve desde esa misma carpeta, por ejemplo un subdominio o alias configurado en hPanel.
3. Permisos de escritura para el proceso Node.
4. Servicio de archivos con soporte de `Range` para MP4/WebM y MIME correcto para PDF/SVG.

El backend FTP no usa ni conoce la ruta física `/home/.../public_html`. La cuenta queda limitada por Hostinger y `MEDIA_FTP_ROOT` se interpreta dentro de esa raíz. La aplicación guarda siempre rutas relativas y construye la URL pública con `MEDIA_BASE_URL`.

## Adaptador físico y consistencia

`lib/media-storage.ts` define `MediaStorageAdapter` con `upload`, `exists`, `delete`, `stat` y `ensureDirectory`.

- `LocalMediaStorage` usa el filesystem bajo `MEDIA_STORAGE_PATH`.
- `HostingerMediaStorage` usa `basic-ftp` 6.2.x, FTPS explícito, certificado validado, timeout configurable y hasta tres intentos.

El flujo de upload es: validar contenido, calcular SHA-256, buscar metadata existente, comprobar que el archivo físico existe, subir sólo si falta metadata y crear la fila después de confirmar tamaño remoto. Si Supabase falla, el backend intenta retirar el upload huérfano. Un asset existente en la base cuyo archivo físico falta produce un error administrativo; no se restaura ni se deduplica silenciosamente.

La ruta conserva la forma inmutable `{tipo}/{prefijo}/{sha256}.{extensión}`. El adaptador crea directorios automáticamente. Un hash nunca se usa para reemplazar contenido distinto, lo que permite caché CDN larga sin servir versiones anteriores.

En una purga, el adaptador correcto elimina el archivo y sólo después se elimina la metadata. La restauración comprueba primero la existencia física. Ninguna operación Hostinger llama `fs.unlink` o `fs.rm` sobre el checkout.

## Prueba de conexión y diagnóstico

Ejecutar con las variables del entorno ya configuradas:

```powershell
npm.cmd run media:check
```

En modo local crea, verifica y elimina un archivo temporal. En Hostinger:

1. conecta con TLS estricto;
2. informa la raíz visible devuelta por `PWD` y lista su contenido sin mostrar nombres ni credenciales;
3. crea un directorio temporal;
4. sube archivos mínimos PNG, PDF y WebM;
5. comprueba acceso HTTP, MIME del PDF y una petición `Range`;
6. elimina archivos y directorio en `finally`.

No deja archivos de prueba si el servidor permite la limpieza. La salida nunca incluye contraseña ni usuario.

La sonda confirmó que el servidor anuncia `AUTH TLS`. La cuenta muestra `ftp://62.72.50.242`; desde agosto de 2026 el certificado presentado autoriza `hstgr.io` y `*.hstgr.io`, por lo que se valida con `MEDIA_FTP_TLS_SERVERNAME=hstgr.io` sin desactivar `rejectUnauthorized`. `PWD` devuelve `/public_html`, que es el root remoto comprobado para esta cuenta.

## Producción y rotación de credenciales

En la aplicación Node `gloobimx.com`, configurar las mismas variables que en localhost y reiniciar el proceso. No configurar secretos en el sitio estático `media.gloobimx.com`. Para rotar la contraseña: cambiarla en hPanel, actualizar `MEDIA_FTP_PASSWORD` en `.env.local` y en las variables de la aplicación, reiniciar y ejecutar `npm.cmd run media:check`. La contraseña anterior no debe quedar en archivos, historial ni documentación.

## CORS y caché

`<img>`, `<video>` y enlaces PDF públicos no requieren CORS para visualización ordinaria. No se añade `Access-Control-Allow-Origin: *`. Si en el futuro canvas, Three.js o `fetch` necesitan leer bytes, configurar en Hostinger orígenes concretos (`https://gloobimx.com` y los localhost necesarios) y los métodos/headers mínimos. Los nombres por hash son inmutables y son compatibles con caché CDN larga.

## Almacenamiento y deduplicación

Cada archivo se valida por firma binaria o contenido, se sanitiza cuando corresponde y se calcula con SHA-256. La ruta física es neutral y deduplicable:

```text
{tipo}/{primeros-2-caracteres-del-hash}/{sha256}.{extension}
```

Un hash existente reutiliza el registro y el archivo. Un archivo nuevo siempre recibe una URL distinta; nunca se sobrescribe un nombre anterior, evitando caché del recurso viejo. Los assets versionados por hash pueden servirse con caché largo e inmutable.

## Modelo de datos

La migración `supabase/0003_media_library.sql` crea:

- `media_assets`: nombres, ruta física/relativa, MIME, extensión, bytes, SHA-256 único, dimensiones conocidas, duración opcional, tipo, fechas y `deleted_at`.
- `media_usages`: relación explícita entre asset, `entity_type`, `entity_id` y `field_name`. Tiene unicidad por uso. El número de usos se deriva de estas filas.

En localhost sin Supabase, la misma forma se persiste en `.mock-data/media.json`.

Al guardar `site_settings` o una invitación se escanean sus URLs de biblioteca y se reconstruyen sus relaciones. Una referencia nueva restaura el asset; una referencia retirada deja al asset en papelera sólo cuando no queda ningún uso global.

## Reemplazo, papelera y limpieza

El reemplazo es una actualización de referencia: se carga o reutiliza el asset nuevo, se guarda la entidad, se sincronizan usos y se evalúa el anterior. Un archivo compartido nunca se elimina mientras tenga alguna fila en `media_usages`.

Un asset con cero usos recibe `deleted_at` durante la sincronización o el siguiente proceso de limpieza. Permanece restaurable durante 7 días. `DELETE /api/admin/media` primero envía a papelera cualquier upload abandonado y elimina físicamente sólo los que ya estaban sin usos, en papelera y con siete días cumplidos. `?force=1` permite vaciar la papelera existente de inmediato desde una operación administrativa deliberada. El endpoint exige sesión admin y puede invocarse diariamente desde el programador disponible en Hostinger; no se añadió infraestructura externa.

## Formatos y seguridad

La matriz del backend es:

| Producto | Formatos aceptados |
| --- | --- |
| Imagen Esencial | JPG/JPEG, PNG, WebP, AVIF |
| Interactiva | PDF y formatos de imagen anteriores |
| Video Invitación | MP4, WebM e imágenes para poster/preview |
| Web Esencial | imágenes, SVG, MP4, WebM |
| Web Premium | imágenes, SVG, MP4, WebM |

El sitio general acepta imagen, SVG y video. Los límites son 20 MB para imágenes, 2 MB para SVG, 30 MB para PDF y 150 MB para video.

La validación no confía en nombre, extensión ni `accept`: detecta firmas de JPEG, PNG, WebP, AVIF, PDF, MP4 y WebM. El SVG debe tener raíz SVG y se rechaza si contiene scripts, eventos, `foreignObject`, documentos/entidades, iframes/objects/embed, JavaScript, HTML embebido, imports, expresiones o recursos externos. Los nombres originales sólo son metadata saneada; el path se genera desde el hash y el cliente nunca decide el destino.

GLB/GLTF no está habilitado. El único uso de Three.js detectado es el fondo líquido cargado desde `threejs-components`; no hay visor ni carga de modelos 3D. Se debe implementar primero el consumidor real y luego ampliar detector, matriz y documentación. Los previews derivados, thumbnails optimizados y duración de video también quedan como mejora posterior; no se recomprime el original.

## CRM y API

- `/admin/media`: biblioteca básica con búsqueda, filtro por tipo, miniatura, tamaño, fecha, usos, papelera/restauración y copia de URL.
- Los campos compartidos ofrecen **Subir archivo** y **Elegir de biblioteca** en el editor del sitio y en los principales campos del editor de invitaciones.
- `POST /api/admin/site/media`: upload autenticado, validación, hash, deduplicación y persistencia.
- `GET/PATCH/DELETE /api/admin/media`: listado, papelera/restauración y limpieza.

Para agregar un formato se debe: añadir detección por contenido en `lib/media-validation.ts`, definir su límite y productos compatibles, confirmar que el frontend realmente lo consume, configurar su MIME en Hostinger y ampliar pruebas/documentación. Nunca basta con agregar una extensión al input.
