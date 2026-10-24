// Baut aus Daten/fahrzeuge-basis.json und den verkleinerten Fotos die Importdatei
// Daten/fahrzeuge.json, die in der App über Menü > Daten importieren eingelesen wird.
// Aufruf: node tools/build-import.mjs
import { readFileSync, writeFileSync } from "node:fs";

const dir = new URL("../Daten/", import.meta.url);
const base = JSON.parse(readFileSync(new URL("fahrzeuge-basis.json", dir), "utf8"));

const photos = Object.entries(base.fotos || {}).map(([vehicleId, file]) => ({
  id: vehicleId,
  vehicleId,
  data: "data:image/jpeg;base64," + readFileSync(new URL("fotos-klein/" + file, dir)).toString("base64"),
}));

const out = { vehicles: base.vehicles, todos: base.todos, entries: base.entries, photos };
writeFileSync(new URL("fahrzeuge.json", dir), JSON.stringify(out));
console.log(`fahrzeuge.json: ${out.vehicles.length} Fahrzeuge, ${out.todos.length} To Do's, ${photos.length} Fotos`);
