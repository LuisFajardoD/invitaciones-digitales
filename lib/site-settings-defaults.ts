import { DEFAULT_BLOCK_ORDER } from "@/lib/constants";
import { DEFAULT_PACKAGES_SERVICE_NOTE, RECOMMENDED_SITE_PACKAGES } from "@/lib/site-packages";
import legacyAssetPaths from "@/lib/legacy-asset-paths.json";
import type { SiteContentPage, SitePageKey, SiteSettingsData } from "@/types/invitations";

const DEFAULT_PAGES: Record<SitePageKey, SiteContentPage> = {
  home: {
    label: "Home",
    path: "/index.html",
    description: "Todo lo visible en la página principal, ordenado de arriba hacia abajo.",
    sections: [
      { id: "hero", label: "01 · Encabezado principal — Hazlo mágico", enabled: true, eyebrow: "Si tu evento es muy importante", title: "Hazlo mágico", description: "Descubre invitaciones digitales interactivas para celebraciones infantiles, bodas, XV años y eventos especiales. Diseños con música integrada, mapas GPS y confirmación RSVP al instante.", video_url: "/assets/gloobi-home/encabezado/mes-de-festejo.webm", background_dark_url: "/assets/gloobi-home/encabezado/fondo-panel-oscuro.avif", background_light_url: "/assets/gloobi-home/encabezado/fondo-panel-claro.avif" },
      { id: "background", label: "02 · Fondo global animado", enabled: true, background_dark_url: "/assets/compartidos/fondos/fondo-global-oscuro.avif", background_light_url: "/assets/compartidos/fondos/fondo-global-claro.avif" },
      { id: "categories", label: "03 · Tarjetas de categorías infantiles", enabled: true, items: ["Espacio", "Dinosaurios", "Fútbol", "Carreras", "Fantasía", "Animales", "Videojuegos", "Princesas"].map((title, index) => ({ title, image_url: `/assets/gloobi-home/tematicas-infantiles/${["espacio","dinosaurios","futbol","carreras","fantasia","animales","videojuegos","princesas"][index]}.avif` })) },
      { id: "comparison", label: "04 · Comparativa — Imagen vs experiencia", enabled: true, title: "De una simple imagen a toda una experiencia", image_url: "/assets/gloobi-home/comparativa/imagen-sin-gloobi.avif", cta_href: "/i/demo-espacio" },
      { id: "demos", label: "05 · Demos destacadas", enabled: true, title: "Demos destacadas", description: "Invitaciones reales para explorar desde el teléfono.", items: [
        { title: "Misión espacial", slug: "demo-espacio", description: "Astronautas, planetas y una invitación lista para cumpleaños galáctico.", href: "/i/demo-espacio" },
        { title: "Aventura jurásica", slug: "demo-dinosaurios", description: "Base editable para fiesta de dinosaurios, exploradores y selva divertida.", href: "/i/demo-dinosaurios" },
        { title: "Final de campeones", slug: "demo-futbol", description: "Invitación tipo estadio para fans, equipos y fiesta deportiva.", href: "/i/demo-futbol" },
        { title: "Pista veloz", slug: "demo-carreras", description: "Base para autos, velocidad, neón y una celebración con mucha energía.", href: "/i/demo-carreras" }
      ] },
      { id: "benefits", label: "06 · Tarjetas — Beneficios", enabled: true, title: "Mucho más que una invitación bonita", description: "Todo lo que tus invitados necesitan, presentado de una forma práctica, personal y especial.", items: [
        ["Todo tu evento en un solo lugar", "Fecha, hora, dirección y la información importante siempre disponible para tus invitados.", "01-todo-tu-evento.avif"],
        ["Ubicación sin complicaciones", "Tus invitados pueden consultar dónde será el evento y abrir la ubicación directamente en su aplicación de mapas.", "02-ubicacion-sin-complicaciones.avif"],
        ["Confirmación de asistencia", "Facilita que tus invitados confirmen si asistirán y obtén la información que necesitas para organizar mejor tu evento.", "03-confirmacion-asistencia.avif"],
        ["La emoción comienza antes", "Una cuenta regresiva convierte los días previos en parte de la celebración y mantiene presente la fecha especial.", "04-la-emocion-comienza-antes.avif"],
        ["Una invitación que se siente tuya", "Fotografías, música, colores y detalles personalizados hacen que cada invitación tenga su propia personalidad.", "05-invitacion-que-se-siente-tuya.avif"],
        ["Cada detalle cuenta", "Programa del evento, código de vestimenta, mesa de regalos, recomendaciones y otras opciones según las necesidades de tu celebración.", "06-cada-detalle-cuenta.avif"]
      ].map(([title, description, file]) => ({ title, description, image_url: `/assets/gloobi-home/beneficios/${file}`, href: "/contact.html#contacto" })) },
      { id: "sharing", label: "07 · Video — Compartirla es así de fácil", enabled: true, title: "Compartirla es así de fácil", description: "Un enlace, un toque y toda la información de tu celebración al alcance de tus invitados.", video_url: "/assets/gloobi-home/compartir/video-central.webm", background_dark_url: "/assets/gloobi-home/compartir/fondo-seccion-compartir.avif", items: [
        { title: "Tarjeta flotante izquierda", image_url: "/assets/gloobi-home/compartir/tarjeta-flotante-izquierda.avif" },
        { title: "Tarjeta flotante derecha", image_url: "/assets/gloobi-home/compartir/tarjeta-flotante-derecha.avif" }
      ] },
      { id: "visual_gallery", label: "08 · Galería — Momentos Gloobi", enabled: true, items: Array.from({ length: 12 }, (_, index) => ({ title: `Momento Gloobi ${index + 1}`, image_url: `/assets/gloobi-home/galeria-visual/galeria-visual-${index + 1}.avif`, href: `/invitaciones?featured=gallery-featured-${String(index + 1).padStart(2, "0")}` })) },
      { id: "celebrations", label: "09 · Carrusel — Tipos de celebración", enabled: true, title: "Explora por tipo de celebración", description: "Encuentra el estilo ideal para tu evento y descubre todas las invitaciones disponibles.", cta_text: "Ver todas las invitaciones", cta_href: "/invitaciones", items: [
        ["Infantiles","infantiles-optimized.avif","infantiles"], ["Cumpleaños","cumpleanos-optimized.avif","cumpleanos"], ["XV años","xv-anos-optimized.avif","xv-anos"], ["Bodas","bodas-optimized.avif","bodas"], ["Bebé","bebe-optimized.avif","bebe"], ["Celebraciones religiosas","celebraciones-religiosas-optimized.avif","religiosas"], ["Graduaciones","graduaciones-optimized.avif","graduaciones"], ["Reuniones","reuniones-optimized.avif","reuniones"], ["Eventos corporativos","eventos-corporativos-optimized.avif","corporativos"]
      ].map(([title,file,slug]) => ({ title, image_url: `/assets/gloobi-home/categorias/${file}`, href: `/invitaciones?categoria=${slug}` })) },
      { id: "pricing", label: "10 · Tipos de invitación y precios", enabled: true, title: "Elige tu tipo de invitación", description: "Encuentra el formato que mejor se adapte a tu celebración, desde una invitación en imagen hasta una experiencia web completa." },
      { id: "process", label: "11 · Proceso — De idea a invitación", enabled: true, title: "De idea a invitación lista para compartir", description: "Un proceso sencillo, acompañado y con oportunidad de revisar cada detalle antes de recibir tu versión final.", items: [
        { title: "Elige tu estilo", description: "Escoge la temática o diseño que más te guste." },
        { title: "Compárteme los datos", description: "Envíame la información, fotografías y detalles de tu evento." },
        { title: "Personalizo tu invitación", description: "Adapto el diseño con la información y detalles de tu celebración." },
        { title: "Revisa tu vista previa", description: "Te envío una versión para que revises con calma los datos y el diseño." },
        { title: "Apruebas tu invitación", description: "Con tu aprobación preparo la versión definitiva." },
        { title: "Recibes tu versión final", description: "Tu invitación queda lista y aprobada." },
        { title: "¡Lista para compartir!", description: "Envíala a tus invitados por WhatsApp, mensaje o donde prefieras." }
      ] },
      { id: "message", label: "12 · Tarjeta de mensaje", enabled: true, video_url: "/assets/gloobi-home/tarjeta/fondo-tarjeta-optimizado.webm", image_url: "/assets/gloobi-home/tarjeta/portada-tarjeta.avif" },
      { id: "footer", label: "13 · Footer", enabled: true, title: "Empieza tu invitación digital con Gloobi", description: "Invitaciones digitales interactivas para fiestas infantiles, bodas, XV años y eventos especiales.", image_url: "/assets/compartidos/pie-pagina/fondo-footer.avif" }
    ]
  },
  catalog: { label: "Muestras", path: "/invitaciones", description: "Encabezado, fondos y textos del catálogo con filtros.", sections: [
    { id: "hero", label: "01 · Encabezado — Explora nuestras invitaciones", enabled: true, eyebrow: "UN DISEÑO PARA CADA HISTORIA", title: "Explora nuestras invitaciones", description: "Encuentra un diseño para tu celebración y descubre todas las opciones disponibles." },
    { id: "background", label: "02 · Fondo animado", enabled: true, background_dark_url: "/assets/compartidos/fondos/fondo-global-oscuro.avif", background_light_url: "/assets/compartidos/fondos/fondo-global-claro.avif" },
    { id: "filters", label: "03 · Filtros y resultados", enabled: true, title: "Filtros", description: "Buscar por nombre, temática o estilo..." },
    { id: "footer", label: "04 · Footer", enabled: true, title: "Empieza tu invitación digital con Gloobi" }
  ] },
  faq: { label: "FAQ", path: "/faq", description: "Encabezado, introducción, preguntas y llamada a contacto.", sections: [
    { id: "hero", label: "01 · Encabezado y fondo global", enabled: true, eyebrow: "RESUELVE TUS DUDAS", title: "Preguntas frecuentes", description: "Resuelve las dudas más comunes sobre nuestras invitaciones digitales, personalización, entrega y funcionamiento.", background_dark_url: "/assets/compartidos/fondos/fondo-global-oscuro.avif", background_light_url: "/assets/compartidos/fondos/fondo-global-claro.avif" },
    { id: "intro", label: "02 · Introducción", enabled: true, eyebrow: "FAQ", title: "Estamos aquí para resolver tus dudas", description: "Encuentra respuestas sobre personalización, funcionamiento, revisión, entrega y uso de tu invitación digital." },
    { id: "questions", label: "03 · Preguntas y respuestas", enabled: true, items: [
      { title: "¿Qué es una invitación digital interactiva?", description: "Es una invitación diseñada para compartirse mediante un enlace y reunir en un mismo lugar la información de tu celebración." },
      { title: "¿Cómo funciona el proceso para crear mi invitación?", description: "Eliges un estilo, compartes la información de tu evento y personalizamos la invitación. Después recibes una vista previa antes de la versión final." },
      { title: "¿Puedo elegir la temática o estilo de mi invitación?", description: "Sí. Puedes elegir entre los diseños disponibles o indicarnos el estilo y temática que buscas." },
      { title: "¿Puedo solicitar cambios antes de aprobar la invitación?", description: "Sí. Antes de la versión final podrás revisar la vista previa y señalar los ajustes incluidos en tu tipo de invitación." },
      { title: "¿Qué información necesito proporcionar?", description: "Normalmente necesitaremos nombre, fecha, horario, ubicación, fotografías, colores, temática y los detalles que quieras compartir." },
      { title: "¿Mis invitados necesitan instalar alguna aplicación?", description: "No. La invitación se consulta mediante un enlace desde el navegador del celular, tablet o computadora." },
      { title: "¿Cómo comparto mi invitación?", description: "Podrás compartir el enlace por WhatsApp, mensajes, redes sociales o el medio que prefieras." },
      { title: "¿La invitación funciona en celulares?", description: "Sí. Los diseños están preparados principalmente para dispositivos móviles y también funcionan en otros tamaños de pantalla." },
      { title: "¿Cómo funciona la confirmación de asistencia?", description: "Cuando incluye RSVP, tus invitados pueden confirmar su asistencia desde la propia invitación." },
      { title: "¿La ubicación puede abrirse en el mapa?", description: "Sí. Cuando el diseño incluye ubicación, los invitados pueden abrir el mapa para facilitar su llegada." },
      { title: "¿Puedo incluir música, fotografías y otros detalles?", description: "Sí. Según el tipo de invitación pueden incorporarse música, galería, programa, mesa de regalos y otros detalles." },
      { title: "¿Qué tipos de eventos manejan?", description: "Celebraciones infantiles, cumpleaños, XV años, bodas, bebé, celebraciones religiosas, graduaciones, reuniones y eventos corporativos." },
      { title: "¿Dónde puedo ver ejemplos antes de elegir?", description: "Visita nuestro catálogo para explorar diseños por categoría y abrir las demos disponibles." },
      { title: "¿Qué tipo de invitación necesito?", description: "Compara los distintos tipos de invitación o contáctanos para ayudarte a elegir la opción adecuada." },
      { title: "¿Cómo puedo solicitar una cotización?", description: "Utiliza el formulario de cotización y comparte los datos principales de tu celebración." }
    ] },
    { id: "contact", label: "04 · ¿Te quedó alguna duda?", enabled: true, eyebrow: "¿TE QUEDÓ ALGUNA DUDA?", title: "¿No encontraste lo que buscabas?", description: "Cuéntanos tu duda y con gusto te ayudamos.", cta_text: "Contactar", cta_href: "/contact.html#contacto" },
    { id: "footer", label: "05 · Footer", enabled: true, title: "Empieza tu invitación digital con Gloobi", description: "Invitaciones digitales interactivas para fiestas infantiles, bodas, XV años y eventos especiales.", image_url: "/assets/compartidos/pie-pagina/fondo-footer.avif" }
  ] },
  contact: { label: "Contacto", path: "/contact.html", description: "Información de contacto, formulario, WhatsApp y fondos.", sections: [
    { id: "hero", label: "01 · Encabezado y fondo global", enabled: true, eyebrow: "HABLEMOS DE TU CELEBRACIÓN", title: "Contacto", description: "Cuéntanos qué estás preparando y te ayudamos a encontrar la invitación adecuada para tu celebración.", background_dark_url: "/assets/compartidos/fondos/fondo-global-oscuro.avif", background_light_url: "/assets/compartidos/fondos/fondo-global-claro.avif" },
    { id: "channels", label: "02 · Tarjetas de canales de atención", enabled: true, items: [
      { title: "WhatsApp", description: "Escríbenos para resolver dudas, solicitar una cotización o comenzar tu invitación.", href: "https://wa.me/525527225459" },
      { title: "Correo", description: "Si prefieres escribirnos por correo, puedes enviarnos los detalles de tu celebración." },
      { title: "Atención en línea", description: "Atendemos de forma digital para ayudarte con tu invitación desde donde estés." }
    ] },
    { id: "form", label: "03 · Formulario de cotización", enabled: true, title: "¿Listo para crear tu invitación digital?", description: "Al enviar, Gloobi te contactará para cotizar tu invitación digital.", background_dark_url: "/assets/contacto/fondo-contacto.avif", cta_text: "Cotizar por WhatsApp" },
    { id: "footer", label: "04 · Footer", enabled: true, title: "Empieza tu invitación digital con Gloobi", description: "Invitaciones digitales interactivas para fiestas infantiles, bodas, XV años y eventos especiales.", image_url: "/assets/compartidos/pie-pagina/fondo-footer.avif" }
  ] },
  about: { label: "Sobre Gloobi", path: "/about.html", description: "Historia, propósito, principios, galería y llamada final.", sections: [
    { id: "hero", label: "01 · Encabezado y fondo global", enabled: true, eyebrow: "CONOCE LA IDEA", title: "Sobre Gloobi", description: "Invitaciones digitales pensadas para hacer que una celebración comience desde el primer mensaje.", background_dark_url: "/assets/compartidos/fondos/fondo-global-oscuro.avif", background_light_url: "/assets/compartidos/fondos/fondo-global-claro.avif" },
    { id: "purpose", label: "02 · Por qué existe Gloobi", enabled: true, eyebrow: "POR QUÉ EXISTE", title: "Una invitación puede ser el primer momento de una gran celebración", description: "Gloobi nace con una idea sencilla: que una invitación no sea solamente una imagen con fecha y lugar, sino una experiencia digital que haga sentir a tus invitados que la celebración ya comenzó.", items: [
      { title: "Imagen comparativa", image_url: "/assets/gloobi-home/comparativa/imagen-sin-gloobi.avif" },
      { title: "Experiencia Gloobi", image_url: "/assets/gloobi-home/beneficios/01-todo-tu-evento.avif" }
    ] },
    { id: "principles", label: "03 · Tarjetas — Lo que guía a Gloobi", enabled: true, eyebrow: "NUESTRA FORMA DE CREAR", title: "Lo que guía a Gloobi", items: [
      { title: "Diseño con intención", description: "Cada elemento debe aportar a la experiencia, no solamente llenar la pantalla." },
      { title: "Personalización real", description: "La invitación se adapta a la celebración, sus colores, fotografías y estilo." },
      { title: "Fácil para tus invitados", description: "Una invitación puede ser bonita y al mismo tiempo clara, práctica y sencilla de usar." },
      { title: "Una experiencia para recordar", description: "El primer contacto con la celebración también puede convertirse en parte del recuerdo." }
    ] },
    { id: "behind", label: "04 · Detrás de Gloobi", enabled: true, eyebrow: "DISEÑO Y DESARROLLO", title: "Detrás de Gloobi", description: "Diseño y desarrollo trabajando juntos para convertir una invitación en una experiencia digital.", image_url: "/assets/gloobi-home/compartir/tarjeta-flotante-derecha.avif" },
    { id: "gallery", label: "05 · Galería de celebraciones", enabled: true, eyebrow: "CADA EVENTO ES ÚNICO", title: "Celebraciones distintas, historias distintas", description: "Cada evento tiene su propia personalidad, y su invitación también puede tenerla.", items: [
      ["Celebración infantil", "infantiles-optimized.avif"], ["Cumpleaños", "cumpleanos-optimized.avif"], ["XV años", "xv-anos-optimized.avif"], ["Boda", "bodas-optimized.avif"], ["Celebración de bebé", "bebe-optimized.avif"], ["Celebración religiosa", "celebraciones-religiosas-optimized.avif"], ["Graduación", "graduaciones-optimized.avif"], ["Reunión", "reuniones-optimized.avif"], ["Evento corporativo", "eventos-corporativos-optimized.avif"]
    ].map(([title, file]) => ({ title, image_url: `/assets/gloobi-home/categorias/${file}` })) },
    { id: "cta", label: "06 · Llamada final", enabled: true, eyebrow: "TU HISTORIA PUEDE EMPEZAR AQUÍ", title: "¿Tienes una celebración en mente?", description: "Explora las invitaciones disponibles o cuéntanos qué tienes en mente.", cta_text: "Ver invitaciones", cta_href: "/invitaciones" },
    { id: "footer", label: "07 · Footer", enabled: true, title: "Empieza tu invitación digital con Gloobi", description: "Invitaciones digitales interactivas para fiestas infantiles, bodas, XV años y eventos especiales.", image_url: "/assets/compartidos/pie-pagina/fondo-footer.avif" }
  ] },
  crm: { label: "Acceso CRM", path: "/admin/login", description: "Textos e imagen de la pantalla de acceso al CRM.", sections: [
    { id: "login", label: "01 · Pantalla de acceso", enabled: true, eyebrow: "CRM GLOOBI", title: "Administra tus invitaciones", description: "Accede para crear, publicar y consultar tus invitaciones digitales.", image_url: "/assets/compartidos/marca/logo-gloobi.svg", background_dark_url: "/assets/compartidos/fondos/fondo-global-oscuro.avif", background_light_url: "/assets/compartidos/fondos/fondo-global-claro.avif" }
  ] }
};

const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  blocks_order: DEFAULT_BLOCK_ORDER,
  pages: DEFAULT_PAGES,
  blocks: {
    hero: {
      enabled: true,
      badge: "Invitaciones premium v1",
      title: "Invitaciones digitales que se sienten como una app.",
      subtitle:
        "Landing editable, CRM con RSVP y experiencias premium listas para compartir por WhatsApp.",
      primary_cta_text: "Cotizar por WhatsApp",
      primary_cta_href: "https://wa.me/5527225459?text=Hola%2C%20quiero%20cotizar%20una%20invitaci%C3%B3n%20digital%20premium.",
      secondary_cta_text: "Ver ejemplos",
      secondary_cta_href: "#examples",
    },
    examples: {
      enabled: true,
      title: "Ejemplos destacados",
      items: [
        {
          title: "Invitación Astronauta",
          description: "Tema astronautas con animación espacial, mapa interactivo y RSVP.",
          slug: "cumple-7-luis-arturo-astronautas",
          cover_url:
            "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
        },
        {
          title: "Invitación Sirena",
          description: "Aventura mágica bajo el mar estilo Sirenita con itinerario, mapa y RSVP.",
          slug: "cumple-5-julieta-mabell",
          cover_url:
            "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80",
        },
      ],
    },
    promo: {
      enabled: true,
      title: "Promo de lanzamiento",
      text: "Incluye configuración inicial del CRM y landing editable en cada paquete premium.",
      valid_from: "2026-02-01T00:00:00.000Z",
      valid_to: "2026-12-31T23:59:59.000Z",
    },
    packages: {
      enabled: true,
      title: "Tipos de invitación y precios",
      service_note: DEFAULT_PACKAGES_SERVICE_NOTE,
      items: RECOMMENDED_SITE_PACKAGES.map((item) => ({
        ...item,
        features: [...item.features],
      })),
    },
    extras: {
      enabled: true,
      title: "Extras",
      items: [
        "Entrega express 24 horas (+$150): prioridad en diseño y entrega antes que trabajos normales.",
        "Cambio de fecha después del cierre (solo invitaciones web, +$80): actualización de fecha/hora sin rediseño completo.",
        "Reporte de asistentes en Excel (solo invitaciones web, +$100): lista editable de confirmaciones para control del evento.",
        "QR listo para imprimir (+$80): archivo limpio para mesa de regalos, recepción o acceso.",
      ],
    },
    how_it_works: {
      enabled: true,
      title: "Secciones disponibles para invitación web",
      items: [
        "Catálogo: Portada, Bitácora de misión, Acciones rápidas, Cuenta regresiva, Ubicación, Checklist, Itinerario, Confirma tu asistencia, Código de vestimenta, Archivo visual, Regalos, Preguntas frecuentes, Canal directo, Transmisión en vivo, Transporte y Hospedaje.",
        "Web Esencial: el cliente elige hasta 4 secciones del catálogo.",
        "Web Premium: incluye todas las secciones que necesite del catálogo.",
        "Las invitaciones web incluyen confirmación de asistencia, panel RSVP y exportación PDF. Excel se ofrece como extra.",
      ],
    },
    faq: {
      enabled: true,
      title: "Políticas y condiciones",
      items: [
        {
          question: "¿Cómo se maneja el anticipo?",
          answer: "Se requiere 50% para iniciar y 50% antes de la entrega final.",
        },
        {
          question: "¿Cuántos cambios incluye cada paquete?",
          answer:
            "Imagen Esencial, Interactiva y Video Invitación incluyen 1 ajuste. Web Esencial incluye 1 ronda de cambios. Web Premium incluye 2 rondas. Cambios adicionales se cotizan por separado.",
        },
        {
          question: "¿Qué se considera un ajuste?",
          answer:
            "Sí cuenta: cambiar textos, mover un detalle, cambiar color o imagen, corregir datos. No cuenta como ajuste menor: cambiar temática completa, estilo completo, tipo de invitación o rehacer desde cero.",
        },
        {
          question: "¿Tienen tiempos de entrega fijos?",
          answer:
            "El tiempo de entrega es aproximado según carga de trabajo y tipo de invitación. Si necesitas prioridad, se puede contratar entrega express.",
        },
        {
          question: "¿Qué pasa si cambian la fecha después del cierre?",
          answer:
            "Una vez entregada y aprobada la invitación final, los cambios posteriores generan costo adicional. En invitaciones web el cambio de fecha posterior al cierre tiene costo de +$80.",
        },
        {
          question: "¿Qué incluye RSVP en paquetes web?",
          answer:
            "Las invitaciones web incluyen confirmación de asistencia, panel RSVP y exportación PDF. El reporte editable en Excel se ofrece como extra.",
        },
      ],
    },
    contact: {
      enabled: true,
      title: "Cotiza tu invitación",
      text: "Cuéntanos fecha, tema y tipo de evento para preparar una propuesta.",
      whatsapp_number: "5527225459",
      whatsapp_prefill_text: "Hola, quiero cotizar una invitación digital premium.",
    },
  },
  invitation_templates: [],
};

function cloneSettings(value: SiteSettingsData): SiteSettingsData {
  return JSON.parse(JSON.stringify(value)) as SiteSettingsData;
}

function shouldUpgradeLegacyPackages(items: SiteSettingsData["blocks"]["packages"]["items"]) {
  if (!Array.isArray(items) || !items.length) {
    return false;
  }

  const normalizeLabel = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const normalizedNames = items.map((item) =>
    normalizeLabel(item?.name || ""),
  );

  const isOldTwoPackageSet =
    items.length === 2 && normalizedNames[0] === "esencial" && normalizedNames[1] === "premium astronautas";

  const isOldThreePackageSet =
    items.length === 3 && normalizedNames[0] === "basica" && normalizedNames[1] === "pro" && normalizedNames[2] === "premium";
  const isOldFiveOrSixPackageSet =
    (items.length === 5 || items.length === 6) &&
    normalizedNames.includes("estatica") &&
    normalizedNames.includes("interactiva") &&
    normalizedNames.includes("video") &&
    normalizedNames.some((value) => value.includes("web")) &&
    normalizedNames.some((value) => value.includes("animada web") || value.includes("premium astronautas"));

  if (!isOldTwoPackageSet && !isOldThreePackageSet && !isOldFiveOrSixPackageSet) {
    return false;
  }

  // Migrate the historical Esencial/Premium Astronautas preset unconditionally.
  if (isOldTwoPackageSet) {
    return true;
  }

  const hasPlaceholderPricing = items.every((item) => {
    const price = (item?.price || "").trim().toLowerCase();
    return !price || /cotizar/.test(price);
  });

  const hasPlaceholderDescription = items.every((item) => {
    const description = (item?.description || "").trim().toLowerCase();
    return !description || /servicio personalizado/.test(description);
  });

  const hasPlaceholderFeatures = items.every((item) => {
    const features = Array.isArray(item?.features) ? item.features : [];
    if (!features.length) {
      return true;
    }
    if (features.length > 1) {
      return false;
    }
    return /diseno|diseño/.test(features[0] || "");
  });

  return hasPlaceholderPricing && hasPlaceholderDescription && hasPlaceholderFeatures;
}

function normalizeLegacyText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function shouldUpgradeLegacyMarketingBlocks(source: SiteSettingsData, packageItems: SiteSettingsData["blocks"]["packages"]["items"]) {
  if (!Array.isArray(packageItems) || packageItems.length !== 2) {
    return false;
  }

  const packageNames = packageItems.map((item) => normalizeLegacyText(item?.name || ""));
  const isLegacyTwoPackageSet =
    packageNames[0] === "esencial" && packageNames[1] === "premium astronautas";

  if (!isLegacyTwoPackageSet) {
    return false;
  }

  const extrasItems = Array.isArray(source.blocks?.extras?.items)
    ? source.blocks.extras.items.map((item) => normalizeLegacyText(item || ""))
    : [];
  const howItems = Array.isArray(source.blocks?.how_it_works?.items)
    ? source.blocks.how_it_works.items.map((item) => normalizeLegacyText(item || ""))
    : [];
  const faqItems = Array.isArray(source.blocks?.faq?.items)
    ? source.blocks.faq.items.map((item) =>
        normalizeLegacyText(`${item?.question || ""} ${item?.answer || ""}`),
      )
    : [];

  const hasLegacyExtras =
    extrasItems.length >= 3 &&
    extrasItems.some((item) => item.includes("personalizacion de copy y colores")) &&
    extrasItems.some((item) => item.includes("carga inicial de galeria"));
  const hasLegacyHow =
    howItems.length >= 3 &&
    howItems.some((item) => item.includes("definimos tema, fecha y lugar")) &&
    howItems.some((item) => item.includes("publicas y compartes un link listo para whatsapp"));
  const hasLegacyFaq =
    faqItems.length >= 2 &&
    faqItems.some((item) => item.includes("puedo editar la landing sin redeploy")) &&
    faqItems.some((item) => item.includes("la vista cliente requiere cuenta"));

  return hasLegacyExtras || hasLegacyHow || hasLegacyFaq;
}

function normalizeExampleItems(
  sourceItems: unknown,
  defaultItems: SiteSettingsData["blocks"]["examples"]["items"],
) {
  if (!Array.isArray(sourceItems)) return defaultItems;
  const validItems = sourceItems.filter((item) => item && typeof item === "object").map((item, index) => {
    const source = item as Partial<SiteSettingsData["blocks"]["examples"]["items"][number]>;
    return {
      title: source.title || `Demo ${index + 1}`,
      description: source.description || "",
      slug: source.slug || "",
      cover_url: source.cover_url || "",
      demo_url: source.demo_url || "",
    };
  });
  return validItems.length ? validItems : defaultItems;
}

export function createDefaultSiteSettings(): SiteSettingsData {
  return cloneSettings(DEFAULT_SITE_SETTINGS);
}

export function normalizeSiteSettingsData(input?: SiteSettingsData | null): SiteSettingsData {
  const defaults = createDefaultSiteSettings();
  const source = input || defaults;
  const sourcePackageItems = Array.isArray(source.blocks?.packages?.items)
    ? source.blocks.packages.items
    : defaults.blocks.packages.items;
  const shouldUpgradeMarketingBlocks = shouldUpgradeLegacyMarketingBlocks(source, sourcePackageItems);
  const packageItems = shouldUpgradeLegacyPackages(sourcePackageItems)
    ? defaults.blocks.packages.items
    : sourcePackageItems;
  const normalizedPages = (Object.keys(defaults.pages) as SitePageKey[]).reduce((pages, pageKey) => {
    const defaultPage = defaults.pages[pageKey];
    const sourcePage = source.pages?.[pageKey];
    const sourceSections = Array.isArray(sourcePage?.sections) ? sourcePage.sections : [];
    pages[pageKey] = {
      ...defaultPage,
      ...sourcePage,
      sections: defaultPage.sections.map((defaultSection) => {
        const sourceSection = sourceSections.find((section) => section?.id === defaultSection.id);
        return {
          ...defaultSection,
          ...sourceSection,
          items: Array.isArray(sourceSection?.items)
            ? sourceSection.items
            : defaultSection.items,
        };
      }),
    };
    return pages;
  }, {} as Record<SitePageKey, SiteContentPage>);

  const normalized: SiteSettingsData = {
    ...defaults,
    ...source,
    blocks_order:
      Array.isArray(source.blocks_order) && source.blocks_order.length
        ? source.blocks_order
        : defaults.blocks_order,
    blocks: {
      ...defaults.blocks,
      ...source.blocks,
      hero: {
        ...defaults.blocks.hero,
        ...source.blocks?.hero,
      },
      examples: {
        ...defaults.blocks.examples,
        ...source.blocks?.examples,
        items: normalizeExampleItems(source.blocks?.examples?.items, defaults.blocks.examples.items),
      },
      promo: {
        ...defaults.blocks.promo,
        ...source.blocks?.promo,
      },
      packages: {
        ...defaults.blocks.packages,
        ...source.blocks?.packages,
        service_note:
          source.blocks?.packages?.service_note || defaults.blocks.packages.service_note,
        items: packageItems,
      },
      extras: {
        ...defaults.blocks.extras,
        ...source.blocks?.extras,
        title:
          shouldUpgradeMarketingBlocks
            ? defaults.blocks.extras.title
            : (source.blocks?.extras?.title || defaults.blocks.extras.title),
        items:
          shouldUpgradeMarketingBlocks
            ? defaults.blocks.extras.items
            : Array.isArray(source.blocks?.extras?.items)
              ? source.blocks.extras.items
              : defaults.blocks.extras.items,
      },
      how_it_works: {
        ...defaults.blocks.how_it_works,
        ...source.blocks?.how_it_works,
        title:
          shouldUpgradeMarketingBlocks
            ? defaults.blocks.how_it_works.title
            : (source.blocks?.how_it_works?.title || defaults.blocks.how_it_works.title),
        items:
          shouldUpgradeMarketingBlocks
            ? defaults.blocks.how_it_works.items
            : Array.isArray(source.blocks?.how_it_works?.items)
              ? source.blocks.how_it_works.items
              : defaults.blocks.how_it_works.items,
      },
      faq: {
        ...defaults.blocks.faq,
        ...source.blocks?.faq,
        title:
          shouldUpgradeMarketingBlocks
            ? defaults.blocks.faq.title
            : (source.blocks?.faq?.title || defaults.blocks.faq.title),
        items:
          shouldUpgradeMarketingBlocks
            ? defaults.blocks.faq.items
            : Array.isArray(source.blocks?.faq?.items)
              ? source.blocks.faq.items
              : defaults.blocks.faq.items,
      },
      contact: {
        ...defaults.blocks.contact,
        ...source.blocks?.contact,
      },
    },
    pages: normalizedPages,
    invitation_templates: Array.isArray(source.invitation_templates)
      ? source.invitation_templates
          .filter((template): template is NonNullable<SiteSettingsData["invitation_templates"]>[number] =>
            Boolean(
              template &&
                typeof template.id === "string" &&
                typeof template.name === "string" &&
                typeof template.source_invitation_id === "string",
            ),
          )
          .map((template) => ({
            ...template,
            description: template.description || "",
            created_at: template.created_at || "",
            updated_at: template.updated_at || "",
          }))
      : defaults.invitation_templates,
  };
  return JSON.parse(JSON.stringify(normalized, (_key, value) =>
    typeof value === "string" ? (legacyAssetPaths as Record<string, string>)[value] || value : value,
  )) as SiteSettingsData;
}
