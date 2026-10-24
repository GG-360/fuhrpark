import { createStore, isDemo } from "./store.js";
import { todayIso, parseDate, addMonths, daysUntil } from "./util.js";

// ---------------------------------------------------------------------------
// Stammwerte
// ---------------------------------------------------------------------------

const TYPES = {
  auto: { label: "Auto", icon: "🚗" },
  cabrio: { label: "Cabrio / Oldtimer", icon: "🏎️" },
  bus: { label: "Bus / Transporter", icon: "🚐" },
  anhaenger: { label: "Anhänger", icon: "🛞" },
  roller: { label: "Roller", icon: "🛵" },
  motorrad: { label: "Motorrad", icon: "🏍️" },
  sonstiges: { label: "Sonstiges", icon: "🚙" },
};

// Arten von To Do's. months = Vorschlag für die Wiederholung, cat = Kategorie in der Historie.
const TODO_TYPES = {
  aufgabe: { label: "Aufgabe (frei)", months: 0, cat: "reparatur" },
  hu: { label: "HU / TÜV", months: 24, cat: "hu" },
  inspektion: { label: "Inspektion", months: 12, cat: "wartung" },
  oel: { label: "Ölwechsel", months: 12, cat: "wartung" },
  reifen: { label: "Reifenwechsel", months: 6, cat: "reifen" },
  versicherung: { label: "Versicherung", months: 12, cat: "versicherung" },
  steuer: { label: "Kfz-Steuer", months: 12, cat: "steuer" },
  saison: { label: "Saisonstart", months: 12, cat: "wartung" },
};

const CATS = {
  wartung: "Wartung / Inspektion",
  reparatur: "Reparatur",
  hu: "HU / TÜV",
  reifen: "Reifen",
  versicherung: "Versicherung",
  steuer: "Kfz-Steuer",
  pflege: "Pflege",
  teile: "Teile / Zubehör",
  sonstiges: "Sonstiges",
};

const HALTER = ["Mama", "Papa", "Martin", "Georg"];

const INTERVALS = { 0: "keine Wiederholung", 1: "jeden Monat", 3: "alle 3 Monate", 6: "alle 6 Monate", 12: "jährlich", 24: "alle 2 Jahre", 36: "alle 3 Jahre" };

// Bewusst keine Felder für FIN, Versicherungsnummer oder Adressen.
// Halter nur als Kurzname aus einer festen Auswahl (Mama, Papa, Martin, Georg).
// Solche Daten sollen nie in der Online-Datenbank landen.
// Rubriken der Detailseite. Feld: [schlüssel, beschriftung, optionen]
// Optionen: type (number | money | date | tel), select (Objekt), area, upper, wide, ph (Platzhalter)
// ["#", "Titel"] erzeugt eine Zwischenüberschrift.
const SECTIONS = {
  stammdaten: {
    label: "Stammdaten",
    fields: [
      ["name", "Bezeichnung", { wide: 1, required: 1 }],
      ["typ", "Art", { select: Object.fromEntries(Object.entries(TYPES).map(([k, t]) => [k, t.label])) }],
      ["kennzeichen", "Kennzeichen", { upper: 1, ph: "M AB 1234" }],
      ["marke", "Marke"],
      ["modell", "Modell"],
      ["erstzulassung", "Erstzulassung", { type: "date" }],
      ["baujahr", "Baujahr", { type: "number" }],
      ["leistung", "Leistung", { ph: "z.B. 85 kW (115 PS)" }],
      ["antrieb", "Antrieb / Kraftstoff"],
      ["akku", "Batterie", { ph: "nur bei Elektro, z.B. 62 kWh" }],
      ["farbe", "Farbe"],
      ["halter", "Halter", { select: { "": "bitte wählen", Mama: "Mama", Papa: "Papa", Martin: "Martin", Georg: "Georg" } }],
      ["fahrer", "Hauptfahrer"],
      ["km", "km-Stand", { type: "number" }],
      ["anhaengelast", "Anhängelast"],
      ["standort", "Standort", { ph: "z.B. Garage Oma" }],
      ["werkstatt", "Werkstatt", { wide: 1 }],
      ["notizen", "Notizen", { area: 1 }],
    ],
  },
  bereifung: {
    label: "Bereifung",
    fields: [
      ["reifenGroesse", "Reifengröße", { ph: "205/55 R16 91V" }],
      ["luftdruck", "Luftdruck", { ph: "vorne 2,3 / hinten 2,5 bar" }],
      ["felgen", "Felgen", { wide: 1, ph: "z.B. Alu 7Jx16 ET45" }],
      ["#", "Sommerreifen"],
      ["sommerMarke", "Marke / Modell"],
      ["sommerDot", "DOT (Herstellwoche)", { ph: "z.B. 1222" }],
      ["sommerProfil", "Profiltiefe", { ph: "z.B. 5 mm" }],
      ["sommerLager", "Lagerort"],
      ["#", "Winterreifen"],
      ["winterMarke", "Marke / Modell"],
      ["winterDot", "DOT (Herstellwoche)"],
      ["winterProfil", "Profiltiefe"],
      ["winterLager", "Lagerort"],
      ["reifenNotiz", "Notizen", { area: 1 }],
    ],
  },
  versicherung: {
    label: "Versicherung",
    fields: [
      ["versicherung", "Versicherer"],
      ["tarif", "Deckung", { select: { "": "bitte wählen", hp: "Haftpflicht", tk: "Teilkasko", vk: "Vollkasko" } }],
      ["sfKlasse", "SF-Klasse"],
      ["zusatz", "Zusatzleistungen", { wide: 1, ph: "z.B. Schutzbrief, Auslandsschutzbrief" }],
      ["beitrag", "Beitrag pro Jahr (€)", { type: "money" }],
      ["steuerBetrag", "Kfz-Steuer pro Jahr (€)", { type: "money" }],
      ["kennzeichenArt", "Kennzeichen", { select: { "": "normal", saison: "Saisonkennzeichen", h: "H-Kennzeichen", e: "E-Kennzeichen", rot07: "Rotes 07er", gruen: "Grünes Kennzeichen" } }],
      ["saison", "Saisonzeitraum", { ph: "z.B. 04 bis 10" }],
      ["schutzbrief", "Pannenhilfe (Telefon)", { type: "tel", wide: 1 }],
      ["versNotiz", "Notizen", { area: 1 }],
    ],
  },
};
const TABS = [...Object.keys(SECTIONS), "todos"];
const TAB_LABEL = { ...Object.fromEntries(Object.entries(SECTIONS).map(([k, s]) => [k, s.label])), todos: "To Do's" };

const ICON = {
  menu: '<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
};

// ---------------------------------------------------------------------------
// Zustand und Helfer
// ---------------------------------------------------------------------------

const $app = document.getElementById("app");
const $sheet = document.getElementById("sheet-root");
const $toast = document.getElementById("toast");

const S = { data: { vehicles: [], todos: [], entries: [], photos: [] }, loaded: false, user: undefined };
let store;

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtDate = s => (s ? parseDate(s).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : "");
const fmtEuro = n => (Number(n) || 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
const fmtEuro0 = n => (Number(n) || 0).toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const fmtKm = n => (n || n === 0 ? Number(n).toLocaleString("de-DE") + " km" : "");
const num = v => (v === "" || v == null ? null : Number(String(v).replace(/\s/g, "").replace(",", ".")));
const blank = v => v == null || v === "";

function getName() { try { return localStorage.getItem("fuhrpark-name") || ""; } catch { return ""; } }
function setName(n) { try { localStorage.setItem("fuhrpark-name", n); } catch {} }

const vehicleById = id => S.data.vehicles.find(v => v.id === id);
const photoOf = id => S.data.photos.find(p => p.id === id)?.data;
const typeOf = v => TYPES[v.typ] || TYPES.sonstiges;
const yearOf = v => v.baujahr || (v.erstzulassung || "").slice(0, 4);
const todoLabel = t => t.titel || TODO_TYPES[t.art]?.label || "To Do";
const sumCost = list => list.reduce((s, e) => s + (Number(e.betrag) || 0), 0);

// Datierte To Do's zuerst (nach Fälligkeit), danach offene ohne Datum.
const byDue = (a, b) => (a.due ? (b.due ? a.due.localeCompare(b.due) : -1) : b.due ? 1 : (a.createdAt || 0) - (b.createdAt || 0));
const todosOf = id => S.data.todos.filter(t => t.vehicleId === id).sort(byDue);
const entriesOf = id => S.data.entries.filter(e => e.vehicleId === id).sort((a, b) => (b.datum || "").localeCompare(a.datum || ""));

function status(t) {
  if (!t.due) return "none";
  const d = daysUntil(t.due);
  return d < 0 ? "over" : d <= 30 ? "soon" : "ok";
}

function relText(t) {
  if (!t.due) return "offen";
  const d = daysUntil(t.due);
  if (d === 0) return "heute fällig";
  if (d === -1) return "seit gestern fällig";
  if (d < 0) return `seit ${-d} Tagen fällig`;
  if (d === 1) return "morgen";
  if (d <= 60) return `in ${d} Tagen`;
  const m = Math.round(d / 30.4);
  return m < 24 ? `in ${m} Monaten` : `in ${Math.round(m / 12)} Jahren`;
}

const sortedVehicles = () => [...S.data.vehicles].sort((a, b) => (a.name || "").localeCompare(b.name || "", "de"));

function parseRoute() {
  const p = location.hash.replace(/^#\/?/, "").split("/");
  if (p[0] === "v" && p[1]) return { name: "vehicle", id: p[1], tab: TABS.includes(p[2]) ? p[2] : "stammdaten" };
  return { name: "home" };
}

// ---------------------------------------------------------------------------
// Bausteine
// ---------------------------------------------------------------------------

const plate = k => (k ? `<span class="plate"><span class="eu">D</span><span>${esc(k)}</span></span>` : "");
const stat = (value, label, st = "") => `<div class="stat ${st ? "st-" + st : ""}"><strong>${value}</strong><span>${label}</span></div>`;
const demoBanner = () => (isDemo ? `<div class="demo">Demo-Modus: Daten liegen nur in diesem Browser.</div>` : "");
const splash = () => `<div class="splash"><div class="spinner"></div></div>`;

const inp = (label, name, val, type = "text", extra = "", wide = false) =>
  `<label class="fld${wide ? " wide" : ""}"><span>${label}</span><input name="${name}" type="${type}" value="${esc(val ?? "")}" ${extra}></label>`;
const sel = (label, name, opts, val, wide = false) =>
  `<label class="fld${wide ? " wide" : ""}"><span>${label}</span><select name="${name}">${Object.entries(opts)
    .map(([k, l]) => `<option value="${esc(k)}"${String(val ?? "") === k ? " selected" : ""}>${esc(l)}</option>`)
    .join("")}</select></label>`;
const area = (label, name, val) => `<label class="fld wide"><span>${label}</span><textarea name="${name}" rows="3">${esc(val ?? "")}</textarea></label>`;

function fieldInput([key, label, o = {}], val) {
  if (key === "#") return `<h3 class="form-sec">${esc(label)}</h3>`;
  if (o.select) return sel(label, key, o.select, val, o.wide);
  if (o.area) return area(label, key, val);
  let type = o.type || "text", extra = "";
  if (o.type === "money") { type = "text"; extra = 'inputmode="decimal" placeholder="0,00"'; val = blank(val) ? "" : String(val).replace(".", ","); }
  if (o.type === "number") extra = 'inputmode="numeric" min="0"';
  if (o.upper) extra += ' autocapitalize="characters"';
  if (o.ph) extra += ` placeholder="${esc(o.ph)}"`;
  if (o.required) extra += " required";
  return inp(label, key, val, type, extra, o.wide);
}

function fieldValue(raw, o = {}) {
  if (o.type === "number" || o.type === "money") return num(raw);
  const s = String(raw ?? "").trim();
  return o.upper ? s.toUpperCase() : s;
}

function fieldDisplay([key, label, o = {}], v) {
  const val = v[key];
  if (blank(val)) return "";
  let out = esc(val);
  if (o.select) out = esc(o.select[val] ?? val);
  if (o.type === "money") out = fmtEuro(val);
  if (o.type === "date") out = fmtDate(val);
  if (key === "km") out = fmtKm(val) + (v.kmDatum ? ` <span class="muted small">Stand ${fmtDate(v.kmDatum)}</span>` : "");
  if (key === "kennzeichen") out = plate(val);
  if (o.type === "tel") out = `<a class="link" href="tel:${esc(String(val).replace(/[^\d+]/g, ""))}">${esc(val)}</a>`;
  const long = o.area || o.wide;
  return `<div class="kv${long ? " long" : ""}"><span class="muted">${esc(label)}</span><span class="kv-val">${out}</span></div>`;
}

// ---------------------------------------------------------------------------
// Seiten
// ---------------------------------------------------------------------------

function render() {
  if (S.user === undefined) { $app.innerHTML = splash(); return; }
  if (!S.user) return renderLogin();
  if (!S.loaded) { $app.innerHTML = splash(); return; }
  const r = parseRoute();
  if (r.name === "vehicle") {
    const v = vehicleById(r.id);
    if (v) return renderVehicle(v, r.tab);
    location.hash = "#/";
    return;
  }
  renderHome();
}

function renderLogin() {
  $app.innerHTML = `
  <div class="login">
    <form class="login-card card" id="login-form">
      <img src="icons/icon-192.png" class="login-logo" alt="">
      <h1>Familien-Fuhrpark</h1>
      <p class="muted">Einmal mit dem Familien-Passwort anmelden. Danach bleibt dieses Gerät angemeldet.</p>
      ${inp("Dein Name", "username", getName(), "text", 'autocomplete="given-name" placeholder="erscheint bei deinen Einträgen"')}
      ${inp("Familien-Passwort", "pw", "", "password", 'autocomplete="current-password" required')}
      <button class="btn primary block" type="submit">Anmelden</button>
      <p class="err" hidden></p>
    </form>
  </div>`;
  const form = document.getElementById("login-form");
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const btn = form.querySelector("button");
    const err = form.querySelector(".err");
    setName(form.username.value.trim());
    btn.disabled = true;
    err.hidden = true;
    try {
      await store.login(form.pw.value);
    } catch (ex) {
      const wrong = ["auth/invalid-credential", "auth/wrong-password", "auth/invalid-login-credentials"].includes(ex.code);
      err.textContent = wrong ? "Das Passwort stimmt nicht." : ex.code === "auth/too-many-requests" ? "Zu viele Versuche. Bitte kurz warten." : `Anmeldung fehlgeschlagen (${ex.code || ex.message}).`;
      err.hidden = false;
      btn.disabled = false;
    }
  });
}

function renderHome() {
  const vs = sortedVehicles();
  const name = getName();

  $app.innerHTML = `
  <header class="topbar">
    <div><div class="eyebrow">${name ? "Hallo " + esc(name) : "Familien-Fuhrpark"}</div><h1>Fuhrpark</h1></div>
    <button class="icon-btn" data-act="menu" aria-label="Menü">${ICON.menu}</button>
  </header>
  <main class="wrap">
    ${demoBanner()}
    ${vs.length
      ? `<div class="vgrid">${vs.map(vehicleCard).join("")}</div>`
      : `<div class="empty card pad"><p>Noch keine Fahrzeuge.</p>
          <button class="btn primary" data-act="add-vehicle">Erstes Fahrzeug anlegen</button>
          <button class="btn ghost" data-act="import">Daten importieren</button></div>`}
  </main>
  <button class="fab" data-act="add-vehicle">${ICON.plus}<span>Fahrzeug</span></button>`;
}

function vehicleCard(v) {
  const list = todosOf(v.id);
  const next = list[0];
  const t = typeOf(v);
  const sub = [v.marke, v.modell].filter(Boolean).join(" ") || t.label;
  const photo = photoOf(v.id);
  return `<a class="vcard" href="#/v/${v.id}">
    ${photo ? `<img class="vthumb" src="${photo}" alt="">` : `<span class="vicon">${t.icon}</span>`}
    <span class="vmain">
      <span class="vname">${esc(v.name)}</span>
      <span class="muted small ellipsis">${esc(sub)}${v.fahrer ? " · " + esc(v.fahrer) : ""}</span>
      ${plate(v.kennzeichen)}
    </span>
    ${next
      ? `<span class="vnext st-${status(next)}"><span>${esc(todoLabel(next))}</span><small>${relText(next)}${list.length > 1 ? ` · +${list.length - 1}` : ""}</small></span>`
      : `<span class="vnext st-none"><small>nichts offen</small></span>`}
  </a>`;
}

function renderVehicle(v, tab) {
  const t = typeOf(v);
  const todos = todosOf(v.id);
  const sub = [v.marke, v.modell, yearOf(v)].filter(Boolean).join(" ");
  const photo = photoOf(v.id);
  const fab = tab === "todos"
    ? `<button class="fab" data-act="add-todo" data-id="${v.id}">${ICON.plus}<span>To Do</span></button>`
    : `<button class="fab" data-act="edit-section" data-id="${v.id}" data-section="${tab}">${ICON.edit}<span>${esc(SECTIONS[tab].label)} bearbeiten</span></button>`;

  $app.innerHTML = `
  <header class="topbar">
    <a class="icon-btn" href="#/" aria-label="Zurück">${ICON.back}</a>
    <h1 class="title-sm">${esc(v.name)}</h1>
    <button class="icon-btn" data-act="menu" aria-label="Menü">${ICON.menu}</button>
  </header>
  <main class="wrap">
    ${demoBanner()}
    ${photo ? `<div class="photo"><img src="${photo}" alt="${esc(v.name)}"><button class="photo-btn" data-act="photo" data-id="${v.id}">Foto ändern</button></div>` : ""}
    <section class="hero card">
      ${photo ? "" : `<button class="vicon big" data-act="photo" data-id="${v.id}" aria-label="Foto hinzufügen">${t.icon}<span class="vicon-add">+</span></button>`}
      <div class="hero-main">
        ${plate(v.kennzeichen)}
        <div class="muted">${esc(sub || t.label)}</div>
        <button class="km-btn" data-act="km" data-id="${v.id}">${blank(v.km) ? "km-Stand eintragen" : fmtKm(v.km)}${v.kmDatum ? `<small>Stand ${fmtDate(v.kmDatum)}</small>` : ""}</button>
      </div>
    </section>
    <nav class="tabs" role="tablist">
      ${TABS.map(k => `<button role="tab" class="${k === tab ? "active" : ""}" data-act="tab" data-tab="${k}">${TAB_LABEL[k]}${k === "todos" && todos.length ? ` <span class="count">${todos.length}</span>` : ""}</button>`).join("")}
    </nav>
    ${tab === "todos" ? todosTab(v, todos) : sectionTab(v, tab)}
  </main>
  ${fab}`;
}

function sectionTab(v, key) {
  const sec = SECTIONS[key];
  const parts = [];
  let group = [];
  let title = null;
  const flush = () => {
    const rows = group.map(f => fieldDisplay(f, v)).join("");
    if (rows) parts.push(`${title ? `<h3 class="yhead">${esc(title)}</h3>` : ""}<div class="list">${rows}</div>`);
    group = [];
  };
  for (const f of sec.fields) {
    if (f[0] === "#") { flush(); title = f[1]; } else group.push(f);
  }
  flush();
  const filled = sec.fields.filter(f => f[0] !== "#" && !blank(v[f[0]])).length;
  const total = sec.fields.filter(f => f[0] !== "#").length;
  if (!parts.length)
    return `<div class="empty card pad"><p>Noch keine ${esc(sec.label)} eingetragen.</p>
      <button class="btn primary" data-act="edit-section" data-id="${v.id}" data-section="${key}">${ICON.edit}Jetzt eintragen</button></div>`;
  return parts.join("") + (filled < total ? `<p class="muted small center">${total - filled} von ${total} Feldern noch leer.</p>` : "");
}

function todosTab(v, todos) {
  const ens = entriesOf(v.id);
  const year = String(new Date().getFullYear());
  const byYear = {};
  ens.forEach(e => (byYear[(e.datum || "").slice(0, 4) || "ohne Datum"] ||= []).push(e));

  const open = todos.length
    ? `<div class="list">${todos.map(todoRow).join("")}</div>`
    : `<div class="empty card pad"><p>Alles erledigt.</p><p class="muted small">Trag hier Termine wie HU/TÜV oder Reifenwechsel ein, oder einfach Aufgaben wie „Scheibenwischer tauschen“.</p></div>`;

  const history = ens.length
    ? Object.keys(byYear).sort().reverse().map(y => `
        <h3 class="yhead"><span>${y}</span><span>${fmtEuro(sumCost(byYear[y]))}</span></h3>
        <div class="list">${byYear[y].map(entryRow).join("")}</div>`).join("")
    : `<p class="card pad muted small">Erledigte To Do's und Werkstattbesuche erscheinen hier mit Kosten.</p>`;

  return `
    <h2>Offen</h2>
    ${open}
    <h2 class="split">Erledigt &amp; Kosten <button class="btn small ghost" data-act="add-entry" data-id="${v.id}">${ICON.plus}Eintrag</button></h2>
    ${ens.length ? `<section class="stats three">${stat(fmtEuro0(sumCost(byYear[year] || [])), "Kosten " + year)}${stat(fmtEuro0(sumCost(ens)), "gesamt")}${stat(ens.length, "Einträge")}</section>` : ""}
    ${history}`;
}

function todoRow(t) {
  const st = status(t);
  const meta = [t.due ? fmtDate(t.due) : "", t.months ? INTERVALS[t.months] : ""].filter(Boolean).join(" · ");
  return `<div class="todo st-${st}">
    <button class="todo-main" data-act="edit-todo" data-id="${t.id}">
      <strong>${esc(todoLabel(t))}</strong>
      <span><span class="tag st-${st}">${relText(t)}</span>${meta ? ` <span class="muted small">${meta}</span>` : ""}</span>
      ${t.notiz ? `<span class="muted small">${esc(t.notiz)}</span>` : ""}
    </button>
    <button class="btn small ghost" data-act="done-todo" data-id="${t.id}" aria-label="Erledigt">${ICON.check}<span class="hide-xs">Erledigt</span></button>
  </div>`;
}

function entryRow(e) {
  const meta = [fmtDate(e.datum), CATS[e.kategorie], e.werkstatt, fmtKm(e.km)].filter(Boolean).map(esc).join(" · ");
  return `<button class="row" data-act="edit-entry" data-id="${e.id}">
    <span class="row-main"><strong>${esc(e.beschreibung || CATS[e.kategorie] || "Eintrag")}</strong><span class="muted small">${meta}</span></span>
    <span class="row-end"><strong>${blank(e.betrag) ? "" : fmtEuro(e.betrag)}</strong>${e.von ? `<span class="muted small">${esc(e.von)}</span>` : ""}</span>
  </button>`;
}

// ---------------------------------------------------------------------------
// Bottom Sheets (Formulare)
// ---------------------------------------------------------------------------

let sheetOpen = false;
let popResolve = null;

function openSheet({ title, body, submit = "Speichern", onSubmit, onDelete, deleteConfirm = "Wirklich löschen?", onOpen }) {
  $sheet.innerHTML = `
    <div class="backdrop" data-act="close-sheet"></div>
    <form class="sheet" role="dialog" aria-label="${esc(title)}">
      <div class="sheet-head"><h2>${esc(title)}</h2><button type="button" class="icon-btn flat" data-act="close-sheet" aria-label="Schließen">${ICON.close}</button></div>
      <div class="sheet-body"><div class="form-grid">${body}</div></div>
      <div class="sheet-foot">
        ${onDelete ? `<button type="button" class="btn danger-ghost" data-role="delete">Löschen</button>` : ""}
        ${onSubmit ? `<button class="btn primary grow" type="submit">${esc(submit)}</button>` : ""}
      </div>
    </form>`;
  document.body.classList.add("noscroll");
  if (!sheetOpen) { history.pushState({ sheet: true }, ""); sheetOpen = true; }
  const form = $sheet.querySelector("form");

  form.addEventListener("submit", async e => {
    e.preventDefault();
    try {
      const go = await onSubmit(Object.fromEntries(new FormData(form)), form);
      if (go === false) return;
      await closeSheet();
      if (typeof go === "string") location.hash = go;
    } catch (err) {
      console.error(err);
      toast("Fehler: " + err.message);
    }
  });

  const del = form.querySelector("[data-role=delete]");
  if (del) {
    let armed = false;
    del.addEventListener("click", async () => {
      if (!armed) { armed = true; del.textContent = deleteConfirm; del.classList.add("armed"); return; }
      const go = await onDelete();
      await closeSheet();
      if (typeof go === "string") location.hash = go;
    });
  }
  onOpen?.(form);
  requestAnimationFrame(() => $sheet.classList.add("open"));
}

function removeSheetDom() {
  $sheet.classList.remove("open");
  $sheet.innerHTML = "";
  document.body.classList.remove("noscroll");
}

function closeSheet() {
  if (!sheetOpen) return Promise.resolve();
  sheetOpen = false;
  removeSheetDom();
  return new Promise(res => { popResolve = res; history.back(); });
}

window.addEventListener("popstate", () => {
  if (popResolve) { const r = popResolve; popResolve = null; r(); return; }
  if (sheetOpen) { sheetOpen = false; removeSheetDom(); }
});

function bumpKm(v, km, datum) {
  if (km && km > (Number(v.km) || 0)) store.update("vehicles", v.id, { km, kmDatum: datum || todayIso() });
}

function newVehicleSheet() {
  openSheet({
    title: "Neues Fahrzeug",
    submit: "Anlegen",
    body: SECTIONS.stammdaten.fields.filter(f => ["name", "typ", "kennzeichen", "marke", "modell", "baujahr"].includes(f[0])).map(f => fieldInput(f, f[0] === "typ" ? "auto" : "")).join(""),
    onSubmit: f => {
      const data = {};
      SECTIONS.stammdaten.fields.forEach(([k, , o]) => { if (k in f) data[k] = fieldValue(f[k], o); });
      const id = store.add("vehicles", data);
      toast("Fahrzeug angelegt");
      return `#/v/${id}`;
    },
  });
}

function sectionSheet(v, key) {
  const sec = SECTIONS[key];
  const isBase = key === "stammdaten";
  openSheet({
    title: sec.label,
    body: sec.fields.map(f => fieldInput(f, v[f[0]])).join(""),
    onSubmit: f => {
      const data = {};
      sec.fields.forEach(([k, , o]) => { if (k !== "#" && k in f) data[k] = fieldValue(f[k], o); });
      if ("km" in data && data.km !== (v.km ?? null)) data.kmDatum = data.km == null ? null : todayIso();
      store.update("vehicles", v.id, data);
      toast("Gespeichert");
    },
    onDelete: isBase && (() => {
      S.data.todos.filter(t => t.vehicleId === v.id).forEach(t => store.remove("todos", t.id));
      S.data.entries.filter(e => e.vehicleId === v.id).forEach(e => store.remove("entries", e.id));
      if (photoOf(v.id)) store.remove("photos", v.id);
      store.remove("vehicles", v.id);
      toast("Fahrzeug gelöscht");
      return "#/";
    }),
    deleteConfirm: "Fahrzeug mit allen Daten löschen?",
  });
}

function todoSheet(vehicleId, t) {
  const x = t || { art: "aufgabe", months: 0 };
  openSheet({
    title: t ? "To Do bearbeiten" : "Neues To Do",
    body: `
      ${sel("Art", "art", Object.fromEntries(Object.entries(TODO_TYPES).map(([k, d]) => [k, d.label])), x.art, true)}
      ${inp("Titel", "titel", x.titel, "text", 'placeholder="z.B. Scheibenwischer tauschen"', true)}
      ${inp("Fällig am (optional)", "due", x.due, "date")}
      ${sel("Wiederholung", "months", INTERVALS, String(x.months || 0))}
      ${area("Notiz", "notiz", x.notiz)}`,
    onOpen: form => form.art.addEventListener("change", () => { form.months.value = String(TODO_TYPES[form.art.value].months); }),
    onSubmit: f => {
      if (f.art === "aufgabe" && !f.titel.trim()) { toast("Bitte einen Titel eingeben"); return false; }
      const data = { vehicleId, art: f.art, titel: f.titel.trim(), due: f.due || null, months: Number(f.months), notiz: f.notiz.trim() };
      if (t) store.update("todos", t.id, data);
      else store.add("todos", { ...data, von: getName() });
      toast(t ? "Gespeichert" : "To Do angelegt");
    },
    onDelete: t && (() => { store.remove("todos", t.id); toast("To Do gelöscht"); }),
  });
}

function doneSheet(t) {
  const v = vehicleById(t.vehicleId);
  const nextFrom = date => (t.months ? addMonths(date, t.months) : "");
  openSheet({
    title: "Erledigt",
    submit: "Als erledigt speichern",
    body: `
      <p class="muted wide">${esc(todoLabel(t))} · ${esc(v.name)}</p>
      ${inp("Erledigt am", "datum", todayIso(), "date", "required")}
      ${inp("km-Stand", "km", v.km, "number", 'inputmode="numeric" min="0"')}
      ${inp("Kosten (€)", "betrag", "", "text", 'inputmode="decimal" placeholder="0,00"')}
      ${inp("Werkstatt", "werkstatt", v.werkstatt)}
      ${area("Notiz", "notiz", "")}
      ${inp("Nächster Termin", "next", nextFrom(todayIso()), "date", "", true)}
      <p class="muted small wide">${t.months ? `Vorschlag: ${INTERVALS[t.months]} ab Erledigt-Datum. Leer lassen, wenn es keinen nächsten Termin gibt.` : "Leer lassen, dann ist das To Do danach weg."}</p>`,
    onOpen: form => form.datum.addEventListener("change", () => { if (t.months && form.datum.value) form.next.value = nextFrom(form.datum.value); }),
    onSubmit: f => {
      store.add("entries", {
        vehicleId: v.id, datum: f.datum, kategorie: TODO_TYPES[t.art]?.cat || "sonstiges", beschreibung: todoLabel(t),
        km: num(f.km), betrag: num(f.betrag), werkstatt: f.werkstatt.trim(), notiz: f.notiz.trim(), von: getName(),
      });
      if (f.next) store.update("todos", t.id, { due: f.next });
      else store.remove("todos", t.id);
      bumpKm(v, num(f.km), f.datum);
      toast(f.next ? `Erledigt. Nächster Termin am ${fmtDate(f.next)}` : "Erledigt");
    },
  });
}

function entrySheet(vehicleId, e) {
  const x = e || { datum: todayIso(), kategorie: "reparatur" };
  openSheet({
    title: e ? "Eintrag bearbeiten" : "Neuer Eintrag",
    body: `
      ${inp("Datum", "datum", x.datum, "date", "required")}
      ${sel("Kategorie", "kategorie", CATS, x.kategorie)}
      ${inp("Beschreibung", "beschreibung", x.beschreibung, "text", 'required placeholder="z.B. Bremsbeläge vorne"', true)}
      ${inp("Kosten (€)", "betrag", blank(x.betrag) ? "" : String(x.betrag).replace(".", ","), "text", 'inputmode="decimal" placeholder="0,00"')}
      ${inp("km-Stand", "km", x.km, "number", 'inputmode="numeric" min="0"')}
      ${inp("Werkstatt", "werkstatt", x.werkstatt, "text", "", true)}
      ${area("Notiz", "notiz", x.notiz)}`,
    onSubmit: f => {
      const data = {
        vehicleId, datum: f.datum, kategorie: f.kategorie, beschreibung: f.beschreibung.trim(), betrag: num(f.betrag),
        km: num(f.km), werkstatt: f.werkstatt.trim(), notiz: f.notiz.trim(), von: e?.von || getName(),
      };
      if (e) store.update("entries", e.id, data);
      else store.add("entries", data);
      bumpKm(vehicleById(vehicleId), data.km, data.datum);
      toast("Gespeichert");
    },
    onDelete: e && (() => { store.remove("entries", e.id); toast("Eintrag gelöscht"); }),
  });
}

function kmSheet(v) {
  openSheet({
    title: "km-Stand",
    body: `
      ${inp("km-Stand", "km", v.km, "number", 'inputmode="numeric" min="0" required')}
      ${inp("Stand vom", "datum", todayIso(), "date", "required")}`,
    onOpen: form => form.km.select(),
    onSubmit: f => { store.update("vehicles", v.id, { km: num(f.km), kmDatum: f.datum }); toast("km-Stand gespeichert"); },
  });
}

let installEvent = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvent = e; });

function menuSheet() {
  openSheet({
    title: "Menü",
    submit: "Name speichern",
    body: `
      ${inp("Dein Name", "name", getName(), "text", 'placeholder="erscheint bei deinen Einträgen"', true)}
      <div class="menu-actions wide">
        <button type="button" class="btn ghost block" data-act="install">Als App installieren</button>
        <button type="button" class="btn ghost block" data-act="export">Daten sichern (Datei)</button>
        <button type="button" class="btn ghost block" data-act="import">Daten importieren (Datei)</button>
        <button type="button" class="btn ghost block" data-act="logout">${isDemo ? "Demo zurücksetzen" : "Abmelden"}</button>
      </div>
      <p class="muted small wide">${isDemo ? "Demo-Modus: Änderungen bleiben nur in diesem Browser." : "Alle Änderungen werden automatisch mit der Familie synchronisiert."}</p>`,
    onSubmit: f => { setName(f.name.trim()); toast("Gespeichert"); render(); },
  });
}

async function install() {
  if (installEvent) {
    installEvent.prompt();
    installEvent = null;
    return;
  }
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  openSheet({
    title: "Als App installieren",
    body: ios
      ? `<ol class="steps wide"><li>Seite in <strong>Safari</strong> öffnen.</li><li>Unten auf <strong>Teilen</strong> tippen (Quadrat mit Pfeil).</li><li><strong>Zum Home-Bildschirm</strong> wählen.</li></ol>`
      : `<ol class="steps wide"><li>Seite in <strong>Chrome</strong> öffnen.</li><li>Oben rechts das Menü <strong>⋮</strong> öffnen.</li><li><strong>App installieren</strong> oder <strong>Zum Startbildschirm hinzufügen</strong> wählen.</li></ol>
         <p class="muted small wide">Am PC: In Chrome oder Edge rechts in der Adresszeile auf das Installieren-Symbol klicken.</p>`,
  });
}

function exportData() {
  const blob = new Blob([JSON.stringify(S.data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `fuhrpark-sicherung-${todayIso()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// Datei-Auswahl ohne sichtbares Eingabefeld.
function pickFile(accept) {
  return new Promise(resolve => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.addEventListener("change", () => resolve(input.files[0] || null));
    input.click();
  });
}

// Foto auf max. 1000 px verkleinern, damit es klein in der Datenbank liegt.
function shrinkImage(file, max = 1000, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("Bild konnte nicht gelesen werden"));
    img.src = URL.createObjectURL(file);
  });
}

async function changePhoto(v) {
  const file = await pickFile("image/*");
  if (!file) return;
  try {
    store.set("photos", v.id, { vehicleId: v.id, data: await shrinkImage(file) });
    toast("Foto gespeichert");
  } catch (err) {
    toast(err.message);
  }
}

// Liest eine Sicherung oder die Importdatei (Daten/fahrzeuge.json) ein.
// Einträge mit gleicher ID werden überschrieben, andere bleiben erhalten.
async function importData() {
  const file = await pickFile("application/json,.json");
  if (!file) return;
  let data;
  try { data = JSON.parse(await file.text()); } catch { toast("Datei ist kein gültiges JSON"); return; }
  const cols = ["vehicles", "todos", "entries", "photos"].filter(c => Array.isArray(data[c]));
  const count = c => (data[c] || []).length;
  openSheet({
    title: "Daten importieren",
    submit: "Importieren",
    body: `<p class="wide">In der Datei gefunden: <strong>${count("vehicles")} Fahrzeuge</strong>, ${count("todos")} To Do's, ${count("entries")} Einträge, ${count("photos")} Fotos.</p>
      <p class="muted small wide">Vorhandene Fahrzeuge mit gleicher Kennung werden überschrieben, alles andere bleibt erhalten.</p>`,
    onSubmit: () => {
      for (const c of cols)
        for (const { id, fin, versNr, ...rest } of data[c]) {
          if (!id) continue;
          if (rest.halter && !HALTER.includes(rest.halter)) delete rest.halter;
          store.set(c, id, rest);
        }
      toast("Import abgeschlossen");
      return "#/";
    },
  });
}

async function logout() {
  await closeSheet();
  store.logout();
}

let toastTimer;
function toast(msg) {
  $toast.textContent = msg;
  $toast.hidden = false;
  requestAnimationFrame(() => $toast.classList.add("show"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    $toast.classList.remove("show");
    setTimeout(() => ($toast.hidden = true), 250);
  }, 2600);
}

// ---------------------------------------------------------------------------
// Ereignisse und Start
// ---------------------------------------------------------------------------

document.addEventListener("click", e => {
  const el = e.target.closest("[data-act]");
  if (!el) return;
  const { act, id } = el.dataset;
  const todo = () => S.data.todos.find(x => x.id === id);
  const actions = {
    "menu": menuSheet,
    "close-sheet": closeSheet,
    "add-vehicle": newVehicleSheet,
    "edit-section": () => sectionSheet(vehicleById(id), el.dataset.section),
    "km": () => kmSheet(vehicleById(id)),
    "add-todo": () => todoSheet(id),
    "edit-todo": () => { const t = todo(); t && todoSheet(t.vehicleId, t); },
    "done-todo": () => { const t = todo(); t && doneSheet(t); },
    "add-entry": () => entrySheet(id),
    "edit-entry": () => { const x = S.data.entries.find(y => y.id === id); x && entrySheet(x.vehicleId, x); },
    "tab": () => { history.replaceState(null, "", `#/v/${parseRoute().id}/${el.dataset.tab}`); render(); },
    "photo": () => changePhoto(vehicleById(id)),
    "install": install,
    "export": exportData,
    "import": importData,
    "logout": logout,
  };
  if (actions[act]) { e.preventDefault(); actions[act](); }
});

window.addEventListener("hashchange", () => { window.scrollTo(0, 0); render(); });

(async function init() {
  render();
  store = await createStore({ onError: err => { console.error(err); toast("Fehler: " + (err.code || err.message)); } });
  store.subscribe((data, loaded) => { S.data = data; S.loaded = loaded; render(); });
  store.onAuth(user => { S.user = user; if (!user) S.loaded = false; render(); });
})().catch(err => {
  $app.innerHTML = `<div class="wrap"><div class="card pad">Die App konnte nicht starten: ${esc(err.message)}</div></div>`;
});
