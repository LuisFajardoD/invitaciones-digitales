// Exportar a Excel: CSV UTF-8 con BOM (acentos y ñ correctos en Excel), comas y valores entre comillas.
import { byName, stats } from "./filters.js";
import { fmt, event } from "./data.js";

const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const slug = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function buildCsv(rsvps) {
  const head = ["Invitado/Familia", "Asiste", "Adultos", "Niños", "Total", "Mensaje", "Fecha de respuesta"];
  const rows = byName(rsvps).map((r) => [r.guestName, r.attending ? "Sí" : "No", r.adults, r.children, r.adults + r.children, r.message, fmt.stamp(r.updatedAt)]);
  const s = stats(rsvps);
  rows.push(["TOTAL", `${s.attending} sí / ${s.declined} no`, s.adults, s.children, s.people, "", ""]);
  return "﻿" + [head, ...rows].map((r) => r.map(q).join(",")).join("\r\n");
}

export function csvFileName(now = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `invitados-${slug(event.childName)}-${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}.csv`;
}

export function downloadCsv(rsvps) {
  const blob = new Blob([buildCsv(rsvps)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: csvFileName() });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
