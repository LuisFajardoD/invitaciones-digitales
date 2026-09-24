// Cálculos, búsqueda, filtros y orden de las respuestas (sin DOM).
import { peopleOf } from "../../_shared/rsvp-contract.js";

/** Totales: personas = suma de adultos + niños de quienes asisten (no respuestas). */
export function stats(rsvps, expected = null) {
  const yes = rsvps.filter((r) => r.attending);
  const adults = yes.reduce((a, r) => a + r.adults, 0);
  const children = yes.reduce((a, r) => a + r.children, 0);
  const responses = rsvps.length;
  return {
    people: adults + children, adults, children, responses,
    attending: yes.length, declined: responses - yes.length,
    withMessage: rsvps.filter((r) => r.message).length,
    expected: expected || null,
    pending: expected ? Math.max(0, expected - responses) : null,
    progress: expected ? Math.min(1, responses / expected) : null
  };
}

const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * @param {Array} rsvps
 * @param {{ q?: string, filter?: "all"|"yes"|"no"|"msg", sort?: "recent"|"az" }} o
 */
export function query(rsvps, { q = "", filter = "all", sort = "recent" } = {}) {
  const nq = norm(q.trim());
  let out = rsvps.filter((r) => {
    if (nq && !norm(r.guestName).includes(nq)) return false;
    if (filter === "yes") return r.attending;
    if (filter === "no") return !r.attending;
    if (filter === "msg") return !!r.message;
    return true;
  });
  out = [...out].sort(sort === "az"
    ? (a, b) => a.guestName.localeCompare(b.guestName, "es", { sensitivity: "base" })
    : (a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return out;
}

export const byName = (list) => [...list].sort((a, b) => a.guestName.localeCompare(b.guestName, "es", { sensitivity: "base" }));
export const recent = (list, n) => [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, n);
export { peopleOf };
