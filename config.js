// Diese Werte kommen aus der Firebase Konsole:
// Projekteinstellungen > Allgemein > Meine Apps > Web-App > SDK-Konfiguration.
// Solange hier "DEIN_API_KEY" steht, läuft die App im Demo-Modus mit Beispieldaten.
// Diese Werte sind nicht geheim. Geschützt werden die Daten durch Passwort und firestore.rules.
export const firebaseConfig = {
  apiKey: "AIzaSyAFPiXwwOHfKg0Rb--vk7k31dpEJv0t1R8",
  authDomain: "familien-fuhrpark.firebaseapp.com",
  projectId: "familien-fuhrpark",
  storageBucket: "familien-fuhrpark.firebasestorage.app",
  messagingSenderId: "348792636601",
  appId: "1:348792636601:web:5c680ec558e9bf644e4768",
};

// E-Mail des gemeinsamen Familien-Kontos (in Firebase Authentication anlegen).
// Muss genauso auch in firestore.rules stehen.
export const familyEmail = "familie@fuhrpark.app";
