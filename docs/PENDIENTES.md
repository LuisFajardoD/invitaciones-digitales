# Pendientes

Lista separada de trabajo pendiente para retomar rapido en un chat nuevo.

## Prioridad alta

### 1. Rediseñar de verdad el CRM React

El CRM React ya es funcional, pero visualmente sigue lejos de lo que se quiere.

Pendiente:
- rehacer el layout tipo dashboard de escritorio
- reducir la sensacion de "tripa" vertical
- usar mejor el ancho en desktop
- convertir modulos en tarjetas colapsables o secciones mas compactas
- acercarlo mas a la referencia tipo Bentofolio
- revisar mejor contraste y densidad visual en temas oscuro y claro

### 2. Corregir estabilidad visual de la pagina completa

Hay reportes de que a veces la pagina completa "se ve agrandada" aunque el zoom del navegador este al 100%.

Pendiente:
- revisar reflows globales del layout del CRM React
- revisar cambios por scrollbars
- revisar si algun contenedor usa `svh`, `dvh`, `vw` o `clamp` de forma inestable
- verificar si hay cambios de ancho al cargar preview, imagenes o fuentes

### 3. Seguir afinando el preview real

El preview con Playwright ya funciona, pero aun hay que pulirlo.

Pendiente:
- revisar consistencia del tamaño de la captura dentro del marco
- validar mejor cuando el dispositivo o modo cambian rapido
- considerar galeria de ultimas capturas por dispositivo
- considerar artefactos de debug opcionales (HTML o logs accesibles desde UI)

## Prioridad media

### 4. Seguir desacoplando Next del frontend

La migracion esta avanzada, pero incompleta.

Pendiente:
- mover mas UI admin al frontend React
- revisar que el editor React cubra el 100% del caso real
- mantener Next principalmente como backend/API
- definir punto de corte para dejar de depender del CRM historico de Next

### 5. Revisar estrategia de produccion

Hoy el deploy principal sigue siendo Next.

Pendiente:
- decidir como se desplegara el frontend React
- decidir si React vivira como app separada o embebida detras del mismo dominio
- validar que Hostinger no rompa la integracion cuando se mueva la capa visual

### 6. Mejorar el flujo de preview y editor

Pendiente:
- revisar si el preview debe quedar siempre fijo y con acciones mas compactas
- mejorar el acomodo de botones bajo el simulador
- decidir si el simulador debe poder alternar entre screenshot real y vista viva

## Prioridad baja

### 7. Documentacion operativa

Pendiente:
- mantener `CAMBIOS_RECIENTES.md` al dia
- mantener `ESTADO_ACTUAL.md` sincronizado cuando cambie la arquitectura
- documentar mejor el flujo de bridge local y fallbacks

### 8. Limpieza tecnica

Pendiente:
- revisar CSS muerto heredado de iteraciones anteriores
- revisar componentes de preview y bridge para simplificar
- evitar duplicar logica entre Next y React cuando ya exista source unico

## Regla para retomar

Cuando se reanude el trabajo:
1. revisar `README.md`
2. revisar `docs/ESTADO_ACTUAL.md`
3. revisar `docs/CAMBIOS_RECIENTES.md`
4. trabajar sobre este archivo para elegir el siguiente bloque
