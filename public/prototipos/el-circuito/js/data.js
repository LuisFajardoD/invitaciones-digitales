// Datos de la invitación "El Circuito". Misma estructura base que temporada-8 e isla-cubo
// (child, event, itinerary, dressCode, gifts, gallery, hosts, rsvp, sound) + campos propios
// (child.runner, bibNumber, rsvp.mockGuests con avatar "circuito-runner" y bestTime).
// Las confirmaciones usan el contrato común: ../../_shared/rsvp-contract.js
export const demoData = {
  invitationId: "el-circuito-demo",
  child: {
    name: "Luis Arturo",
    age: 8,
    photo: "assets/placeholders/foto-1.svg",
    runner: { skin: "#E8B48A", hair: "#3B2A1A", hairStyle: "short", shirt: "#3D5AFE", shorts: "#1B1F3B", shoes: "#FF5A5F", headband: "#FFC93C" }
  },
  titleOverride: null, // si es null → "El Circuito de {name}"
  bibNumber: null, // si es null → age
  event: {
    dateISO: "2026-11-14T16:00:00-06:00",
    endTime: "20:00",
    venueName: "Salón Aventura",
    address: "Av. Ejemplo 123, Col. Centro, CDMX",
    googleMapsUrl: "https://maps.google.com/?q=Av.+Ejemplo+123,+Col.+Centro,+CDMX",
    wazeUrl: "https://waze.com/ul?q=Av.%20Ejemplo%20123%20CDMX"
  },
  itinerary: [
    { time: "4:00 pm", title: "Llegada", icon: "flag" },
    { time: "4:30 pm", title: "Juegos", icon: "controller" },
    { time: "6:00 pm", title: "Pastel", icon: "cake" },
    { time: "6:30 pm", title: "Piñata", icon: "star" }
  ],
  dressCode: { title: "Uniforme de carrera", text: "Ropa cómoda y tenis" },
  gifts: [
    { name: "Tu presencia", highlight: true, url: null, note: "El mejor premio de la carrera" },
    { name: "Mesa de regalos Liverpool", url: "https://www.liverpool.com.mx/tienda/mesa-de-regalos", note: "Evento #000000" },
    { name: "Mesa de regalos Amazon", url: "https://www.amazon.com.mx/", note: "" },
    { name: "Lluvia de sobres", url: null, note: "Habrá buzón en la fiesta" }
  ],
  gallery: [
    { src: "assets/placeholders/foto-1.svg", caption: "Primer paso, primera carrera" },
    { src: "assets/placeholders/foto-2.svg", caption: "Velocidad máxima" },
    { src: "assets/placeholders/foto-3.svg", caption: "Campeón de la alberca" },
    { src: "assets/placeholders/foto-4.svg", caption: "Siempre sonriendo" },
    { src: "assets/placeholders/foto-5.svg", caption: "¡8 años!" }
  ],
  hosts: "Mamá y Papá de Luis Arturo",
  rsvp: {
    whatsapp: "5215500000000",
    messageYes: "¡Hola! Soy {guestName} y confirmo asistencia a la fiesta de {childName} 🏁\nAdultos: {adults}\nNiños: {children}\n{messageLine}",
    messageNo: "¡Hola! Soy {guestName}. Lamentablemente no podré asistir a la fiesta de {childName}. {messageLine}",
    messageLinePrefix: "Mensaje: ",
    deadlineText: "Confirma antes del 7 de noviembre",
    mockGuests: [
      { guestName: "Sofía", attending: true, adults: 1, children: 1, avatar: { style: "circuito-runner", color: "#FF9FCB", hair: "pigtails" }, bestTime: 41.8 },
      { guestName: "Mateo", attending: true, adults: 2, children: 2, avatar: { style: "circuito-runner", color: "#9BE564", hair: "short" }, bestTime: 38.2 },
      { guestName: "Valentina", attending: true, adults: 1, children: 1, avatar: { style: "circuito-runner", color: "#B388FF", hair: "long" }, bestTime: 44.5 },
      { guestName: "Diego", attending: true, adults: 2, children: 1, avatar: { style: "circuito-runner", color: "#FFC93C", hair: "short" }, bestTime: 40.1 }
    ]
  },
  sound: { enabledByDefault: true },
  loadingTips: ["Inflando los inflables…", "Llenando el lago…", "Atando las agujetas…", "Poniendo el dorsal…"]
};
