# Familien-Fuhrpark: Einrichtung

Die App läuft komplett kostenlos: GitHub Pages liefert die Webseite aus, Firebase speichert die gemeinsamen Daten.

## 1. Lokal anschauen (Demo-Modus)

```
npx --yes http-server . -p 8080 -c-1
```

Dann im Browser http://localhost:8080 öffnen. Solange in `config.js` noch `DEIN_API_KEY` steht, läuft die App mit Beispieldaten, die nur im eigenen Browser gespeichert werden.

## 2. Firebase einrichten (ca. 10 Minuten)

1. https://console.firebase.google.com öffnen und mit einem Google-Konto anmelden.
2. **Projekt hinzufügen**, Name z.B. `familien-fuhrpark`. Google Analytics kann aus bleiben.
3. Links **Build > Authentication > Jetzt starten**. Anbieter **E-Mail/Passwort** aktivieren.
4. Reiter **Users > Nutzer hinzufügen**: E-Mail `familie@fuhrpark.app`, dazu ein Familien-Passwort. Die E-Mail muss nicht echt sein.
5. Links **Build > Firestore Database > Datenbank erstellen**. Standort `europe-west3 (Frankfurt)`, Produktionsmodus.
6. Dort Reiter **Regeln**: den Inhalt von `firestore.rules` hineinkopieren und **Veröffentlichen**.
7. Zahnrad **Projekteinstellungen > Allgemein**, unten das Web-Symbol `</>` anklicken, App registrieren (Hosting nicht ankreuzen). Die angezeigten Werte (`apiKey`, `authDomain`, ...) in `config.js` eintragen.

Der `apiKey` darf öffentlich sein. Geschützt werden die Daten durch das Passwort und die Regeln aus Schritt 6.

## 3. Auf GitHub Pages veröffentlichen

1. Konto auf https://github.com anlegen (falls noch nicht vorhanden).
2. Neues Repository `fuhrpark` anlegen, Sichtbarkeit **Public** (für kostenloses Pages nötig; es liegen dort nur Programmdateien, keine Fahrzeugdaten).
3. Dateien hochladen (Claude kann das per git übernehmen).
4. Im Repository **Settings > Pages**: Source `Deploy from a branch`, Branch `main`, Ordner `/ (root)`.
5. Nach etwa einer Minute ist die App unter `https://DEIN-NAME.github.io/fuhrpark/` erreichbar.
6. Zurück in Firebase: **Authentication > Einstellungen > Autorisierte Domains** und `DEIN-NAME.github.io` hinzufügen.

## 4. Fahrzeugdaten einspielen (einmalig)

Die echten Fahrzeugdaten liegen nur lokal in `Daten/fahrzeuge.json` und werden nie auf GitHub hochgeladen.

1. Nach Änderungen an `Daten/fahrzeuge-basis.json` oder neuen Fotos: `node tools/build-import.mjs` ausführen.
2. App online öffnen, anmelden, **Menü > Daten importieren (Datei)** und `Daten/fahrzeuge.json` wählen.

## 5. Familie einladen

Link schicken, dazu das Familien-Passwort.

* **iPhone:** Link in Safari öffnen, Teilen, **Zum Home-Bildschirm**.
* **Android:** Link in Chrome öffnen, Menü ⋮, **App installieren**.
* **PC:** In Chrome oder Edge auf das Installieren-Symbol in der Adresszeile klicken, oder einfach als Lesezeichen speichern.

Jeder gibt beim ersten Login seinen Namen an. Der Name erscheint dann bei den eigenen Einträgen.

## Aufbau

| Datei | Inhalt |
|---|---|
| `app.js` | Oberfläche und Logik. Die Felder der Rubriken stehen oben im Objekt `SECTIONS`. |
| `store.js` | Datenspeicherung (Firebase oder Demo). |
| `config.js` | Firebase-Zugangsdaten. |
| `firestore.rules` | Zugriffsregeln für die Datenbank. |
| `sw.js`, `manifest.webmanifest` | Installierbarkeit und Offline-Betrieb. |
