// Datums-Helfer. Alle Daten werden als "JJJJ-MM-TT" gespeichert.

export const pad = n => String(n).padStart(2, "0");
export const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayIso = () => iso(new Date());

export function parseDate(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s, n) {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}

export function addMonths(s, n) {
  const d = parseDate(s);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return iso(d);
}

export const daysUntil = s => Math.round((parseDate(s) - parseDate(todayIso())) / 864e5);
