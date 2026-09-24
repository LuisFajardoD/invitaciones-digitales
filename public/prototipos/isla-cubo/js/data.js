// Única fuente de datos de la invitación "Isla Cubo".
// Comparte la estructura base de temporada-8 (child, event, itinerary, dressCode, gifts, gallery,
// hosts, rsvp, sound) y añade sólo lo propio de esta plantilla (island, mockGuests, highlight, caption).

export const demoData = {
  invitationId: "isla-cubo-demo",
  child: { name: "Luis Arturo", age: 8, photo: "assets/placeholders/foto-1.svg" },
  titleOverride: null, // si es null → "La Isla de {name}"
  island: {
    name: null, // si es null → "Isla {name}"
    monumentText: "LUIS", // texto construido en bloques en la cima (máx. 8 caracteres; soporta Á É Í Ó Ú Ñ)
    favoriteColor: "#4CC9F0" // color de acento del monumento y banderas
  },
  event: {
    dateISO: "2026-11-14T16:00:00-06:00",
    endTime: "20:00",
    venueName: "Salón Aventura",
    address: "Av. Ejemplo 123, Col. Centro, CDMX",
    googleMapsUrl: "https://maps.google.com/?q=Av.%20Ejemplo%20123%2C%20Col.%20Centro%2C%20CDMX",
    wazeUrl: "https://waze.com/ul?q=Av.%20Ejemplo%20123%2C%20Col.%20Centro%2C%20CDMX&navigate=yes"
  },
  itinerary: [
    { time: "4:00 pm", title: "Llegada", icon: "flag" },
    { time: "4:30 pm", title: "Juegos", icon: "controller" },
    { time: "6:00 pm", title: "Pastel", icon: "cake" },
    { time: "6:30 pm", title: "Piñata", icon: "star" }
  ],
  dressCode: { title: "Código de vestimenta", text: "Ropa cómoda y colores brillantes" },
  gifts: [
    { name: "Tu presencia", highlight: true, url: null, note: "El mejor tesoro del cofre" },
    { name: "Mesa de regalos Liverpool", url: "https://mesaderegalos.liverpool.com.mx/", note: "Evento #000000" },
    { name: "Mesa de regalos Amazon", url: "https://www.amazon.com.mx/", note: "" },
    { name: "Lluvia de sobres", url: null, note: "Habrá buzón en la fiesta" }
  ],
  gallery: [
    { src: "assets/placeholders/foto-1.svg", caption: "Explorador desde siempre" },
    { src: "assets/placeholders/foto-2.svg", caption: "Constructor oficial" },
    { src: "assets/placeholders/foto-3.svg", caption: "Primer castillo" },
    { src: "assets/placeholders/foto-4.svg", caption: "Modo aventura" },
    { src: "assets/placeholders/foto-5.svg", caption: "¡8 años!" }
  ],
  hosts: "Mamá y Papá de Luis Arturo",
  rsvp: {
    whatsapp: "5215500000000",
    // Plantillas de WhatsApp (la línea del mensaje se omite si está vacío)
    messageYes: "¡Hola! Soy {guestName} y confirmo asistencia a la fiesta de {childName} 🎉\nAdultos: {adults}\nNiños: {children}\n{messageLine}",
    messageNo: "¡Hola! Soy {guestName}. Lamentablemente no podré asistir a la fiesta de {childName}. {messageLine}",
    messageLinePrefix: "Mensaje: ",
    deadlineText: "Confirma antes del 7 de noviembre",
    mockGuests: [
      { name: "Sofía", color: "#FF9FCB", symbol: "heart", attending: true, adults: 1, children: 1 },
      { name: "Mateo", color: "#9BE564", symbol: "ball", attending: true, adults: 2, children: 2 },
      { name: "Valentina", color: "#B388FF", symbol: "star", attending: true, adults: 1, children: 1 },
      { name: "Diego", color: "#FFD23F", symbol: "bolt", attending: true, adults: 2, children: 1 },
      { name: "Regina", color: "#4CC9F0", symbol: "flower", attending: true, adults: 1, children: 2 },
      { name: "Emilio", color: "#FF6B6B", symbol: "paw", attending: false, adults: 0, children: 0 }
    ]
  },
  loadingTips: [
    "Colocando el primer bloque…",
    "Pintando el cielo…",
    "Escondiendo el cofre del tesoro…",
    "Inflando los globos…"
  ],
  sound: { enabledByDefault: true }
};
