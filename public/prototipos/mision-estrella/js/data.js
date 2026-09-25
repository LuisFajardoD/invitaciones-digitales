// Datos de la invitación "Misión Estrella". Misma estructura base que temporada-8, isla-cubo y el-circuito
// (child, event, itinerary, dressCode, gifts, gallery, hosts, rsvp, sound) + los campos que ya maneja el editor
// de Gloobi (checklist, faq, liveStream, transport, lodging, contact) + los propios (missionName, tagline,
// child.visorPhotoSleeping / child.visorPhotoAwake, child.suitColor, child.accentColor, avatar "mission-patch").
// Todo texto o dato variable de la invitación sale de aquí. Plantillas: {name}, {age}, {missionName}.
// Las confirmaciones usan el contrato común: ../../_shared/rsvp-contract.js
export const demoData = {
  invitationId: "mision-estrella-demo",
  child: {
    name: "Luis Arturo",
    age: 8,
    // fotos del niño dentro del visor (cara centrada, fondo oscuro, ≤ 512 px): dormido (ojos cerrados) en la portada y
    // despierto (ojos abiertos) en el resto. Junto a cada .avif va una copia .webp de respaldo. Ver visorPhotos().
    visorPhotoSleeping: "assets/placeholders/visor-dormido.avif",
    visorPhotoAwake: "assets/placeholders/visor-despierto.avif",
    suitColor: "#F4F1FA",
    accentColor: "#FF8FA3" // parche, detalles del traje y cohete
  },
  missionName: null, // si es null → "Misión {name}"
  tagline: "Hola, soy {name} y estoy por cumplir…",
  event: {
    dateISO: "2026-11-14T16:00:00-06:00",
    endTime: "20:00",
    venueName: "Jardín Diversión",
    address: "Calle Moneda No. 24, Col. Anzures, CDMX",
    googleMapsUrl: "https://maps.google.com/?q=Calle+Moneda+24,+Anzures,+CDMX",
    wazeUrl: "https://waze.com/ul?q=Calle%20Moneda%2024%20Anzures%20CDMX"
  },
  itinerary: [
    { time: "4:00 pm", title: "Bienvenida y fotos de aterrizaje" },
    { time: "4:30 pm", title: "Juegos y misiones espaciales" },
    { time: "6:00 pm", title: "Pastel y canción" },
    { time: "6:30 pm", title: "Piñata, regalos y despedida" }
  ],
  dressCode: { title: "Código de vestimenta", text: "Look cómodo en tonos azul, plata o blanco. Si quieres, suma un detalle espacial." },
  checklist: ["Trae mucha energía para jugar.", "Si gustas, ven con outfit espacial (opcional)."],
  gifts: [
    { name: "Tu presencia", highlight: true, url: null, note: "La carga más valiosa de la misión" },
    { name: "Mesa de regalos Liverpool", url: "https://www.liverpool.com.mx/tienda/mesa-de-regalos", note: "Evento #000000" },
    { name: "Lluvia de sobres", url: null, note: "Habrá buzón en la fiesta" }
  ],
  gallery: [
    { src: "assets/placeholders/foto-1.svg", caption: "Primer viaje" },
    { src: "assets/placeholders/foto-2.svg", caption: "Explorador de estrellas" },
    { src: "assets/placeholders/foto-3.svg", caption: "Siempre curioso" },
    { src: "assets/placeholders/foto-4.svg", caption: "Mi sonrisa favorita" },
    { src: "assets/placeholders/foto-5.svg", caption: "Aventura en familia" },
    { src: "assets/placeholders/foto-6.svg", caption: "¡8 años!" }
  ],
  faq: [
    { q: "¿Hay estacionamiento?", a: "Sí, dentro del lugar." },
    { q: "¿Cuántos asistentes puedo confirmar?", a: "Por favor confirma el total de adultos y niños." }
  ],
  liveStream: { enabled: true, text: "Si no puedes venir, tendremos una señal privada para ver el festejo.", url: "https://example.com/transmision" },
  transport: { enabled: true, text: "Si vienes en auto, usa la entrada principal. Si vienes en taxi o app, comparte la ubicación del mapa." },
  lodging: { enabled: true, text: "Recomendamos hospedarse cerca de la zona si vienes de fuera." },
  contact: { name: "Adry", phone: "5215500000000", text: "Si necesitas ayuda antes del evento, escríbeme aquí." },
  hosts: "Mamá y Papá de Luis Arturo",
  rsvp: {
    whatsapp: "5215500000000",
    messageYes: "¡Hola! Soy {guestName} y me uno a la tripulación de la {missionName} 🚀\nAdultos: {adults}\nNiños: {children}\n{messageLine}",
    messageNo: "¡Hola! Soy {guestName}. Lamentablemente no podré asistir a la fiesta de {childName}. {messageLine}",
    messageLinePrefix: "Mensaje: ",
    deadlineText: "Confirma antes del 7 de noviembre",
    mockGuests: [
      { guestName: "Sofía", attending: true, adults: 1, children: 1, avatar: { style: "mission-patch", color: "#FF8FA3", symbol: "heart" } },
      { guestName: "Mateo", attending: true, adults: 2, children: 2, avatar: { style: "mission-patch", color: "#6FD6E8", symbol: "rocket" } },
      { guestName: "Valentina", attending: true, adults: 1, children: 1, avatar: { style: "mission-patch", color: "#B9A2FF", symbol: "star" } },
      { guestName: "Diego", attending: true, adults: 2, children: 1, avatar: { style: "mission-patch", color: "#FFD27A", symbol: "planet" } },
      { guestName: "Regina", attending: true, adults: 1, children: 2, avatar: { style: "mission-patch", color: "#9BE5B4", symbol: "moon" } }
    ]
  },
  sound: { enabledByDefault: true }
};

/** Visor por defecto (ilustración) si no hay ninguna foto. */
export const VISOR_FALLBACK = "assets/placeholders/visor.svg";
/** Fotos del visor ya resueltas: sin foto dormido se usa la despierto; sin ninguna, la ilustración. */
export function visorPhotos(child = demoData.child) {
  const awake = child.visorPhotoAwake || child.visorPhotoSleeping || VISOR_FALLBACK;
  return { sleeping: child.visorPhotoSleeping || awake, awake };
}
