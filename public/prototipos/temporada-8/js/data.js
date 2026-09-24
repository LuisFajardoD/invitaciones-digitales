// Única fuente de datos de la invitación. Todo texto o valor variable sale de aquí.
// Pensado para convertirse después en una plantilla editable desde el CRM.

export const demoData = {
  invitationId: "temporada-8-demo",
  child: {
    name: "Luis Arturo",
    gamertag: "LuisArturo_8",
    age: 8,
    photo: "assets/placeholders/foto-1.svg",
    avatarColors: { head: "#F2C29B", hair: "#3B2A1A", shirt: "#4CC9F0", pants: "#1B2A6B", shoes: "#FFFFFF", accent: "#FFD23F" }
  },
  titleOverride: null, // si es null → "{name} · Temporada {age}"
  event: {
    dateISO: "2026-11-14T16:00:00-06:00",
    endTime: "20:00",
    venueName: "Salón Aventura",
    address: "Av. Ejemplo 123, Col. Centro, CDMX",
    googleMapsUrl: "https://maps.google.com/?q=Av.%20Ejemplo%20123%2C%20Col.%20Centro%2C%20CDMX",
    wazeUrl: "https://waze.com/ul?q=Av.%20Ejemplo%20123%2C%20Col.%20Centro%2C%20CDMX&navigate=yes",
    mapPin: { x: 0.52, y: 0.46 } // posición relativa del salón en el mapa ilustrado
  },
  zone: { startDaysBefore: 30 }, // cuándo la zona está en su tamaño máximo
  itinerary: [
    { level: 1, time: "4:00 pm", title: "Llegada", reward: "Spawn en el lobby", icon: "flag" },
    { level: 2, time: "4:30 pm", title: "Juegos", reward: "Mini-juegos desbloqueados", icon: "controller" },
    { level: 3, time: "6:00 pm", title: "Pastel", reward: "+100% energía", icon: "cake" },
    { level: 4, time: "6:30 pm", title: "Piñata", reward: "Botín legendario", icon: "star" }
  ],
  dressCode: { title: "Skin recomendada", text: "Ropa cómoda y colores brillantes" },
  gifts: [
    { name: "Tu presencia", rarity: "legendary", price: null, url: null, note: "El objeto más valioso de la tienda" },
    { name: "Mesa de regalos Liverpool", rarity: "epic", url: "https://mesaderegalos.liverpool.com.mx/", note: "Evento #000000" },
    { name: "Mesa de regalos Amazon", rarity: "rare", url: "https://www.amazon.com.mx/", note: "" },
    { name: "Lluvia de sobres", rarity: "common", url: null, note: "Habrá buzón en la fiesta" }
  ],
  gallery: [
    { src: "assets/placeholders/foto-1.svg", tag: "+50 de ternura" },
    { src: "assets/placeholders/foto-2.svg", tag: "Récord personal" },
    { src: "assets/placeholders/foto-3.svg", tag: "Primer nivel superado" },
    { src: "assets/placeholders/foto-4.svg", tag: "Modo explorador" },
    { src: "assets/placeholders/foto-5.svg", tag: "Jugador legendario" }
  ],
  loadingTips: [
    "Consejo: el pastel restaura el 100% de energía.",
    "Consejo: la piñata tiene botín legendario.",
    "Consejo: los abrazos no gastan munición.",
    "Consejo: bailar suma +10 de diversión."
  ],
  hosts: "Mamá y Papá de Luis Arturo",
  rsvp: {
    whatsapp: "5215500000000",
    // Plantillas de WhatsApp (la línea del mensaje se omite si está vacío)
    messageYes: "¡Hola! Soy {guestName} y confirmo asistencia a la fiesta de {childName} 🎉\nAdultos: {adults}\nNiños: {children}\n{messageLine}",
    messageNo: "¡Hola! Soy {guestName}. Lamentablemente no podré asistir a la fiesta de {childName}. {messageLine}",
    messageLinePrefix: "Mensaje: ",
    deadlineText: "Confirma antes del 7 de noviembre",
    // hair: "short" | "long" | "pigtails"
    mockPlayers: [
      { name: "Sofía", color: "#FF6B6B", hair: "long", attending: true, adults: 1, children: 1 },
      { name: "Mateo", color: "#9BE564", hair: "short", attending: true, adults: 2, children: 2 },
      { name: "Valentina", color: "#FF9FCB", hair: "pigtails", attending: true, adults: 1, children: 1 },
      { name: "Diego", color: "#FFD23F", hair: "short", attending: true, adults: 2, children: 1 },
      { name: "Renata", color: "#B388FF", hair: "long", attending: false, adults: 0, children: 0 }
    ]
  },
  sound: { enabledByDefault: true }
};
