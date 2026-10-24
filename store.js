// Datenhaltung: Firebase (echter Betrieb) oder localStorage (Demo-Modus).
// Beide liefern dieselbe Schnittstelle. Schreibzugriffe laufen ohne await,
// damit die App auch offline sofort reagiert. Fehler gehen an onError.

import { firebaseConfig, familyEmail } from "./config.js";

export const COLS = ["vehicles", "todos", "entries", "photos"];
const FIREBASE_VERSION = "10.12.2";

export const isDemo = !firebaseConfig?.apiKey || firebaseConfig.apiKey.startsWith("DEIN");

export function createStore({ onError }) {
  return isDemo ? demoStore() : firebaseStore(onError);
}

async function firebaseStore(onError) {
  const base = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/`;
  const [{ initializeApp }, A, F] = await Promise.all([
    import(base + "firebase-app.js"),
    import(base + "firebase-auth.js"),
    import(base + "firebase-firestore.js"),
  ]);
  const app = initializeApp(firebaseConfig);
  const auth = A.getAuth(app);
  let db;
  try {
    db = F.initializeFirestore(app, {
      localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }),
    });
  } catch {
    db = F.getFirestore(app);
  }

  const data = Object.fromEntries(COLS.map(c => [c, []]));
  const loaded = new Set();
  let listener = () => {};
  let unsubs = [];
  const emit = () => listener({ ...data }, loaded.size === COLS.length);

  const stop = () => {
    unsubs.forEach(u => u());
    unsubs = [];
    loaded.clear();
    COLS.forEach(c => (data[c] = []));
  };
  const start = () => {
    stop();
    unsubs = COLS.map(c =>
      F.onSnapshot(
        F.collection(db, c),
        snap => {
          data[c] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          loaded.add(c);
          emit();
        },
        onError
      )
    );
  };
  const guard = p => p.catch(onError);

  return {
    demo: false,
    onAuth: cb => A.onAuthStateChanged(auth, u => { u ? start() : stop(); cb(u); }),
    login: pw => A.signInWithEmailAndPassword(auth, familyEmail, pw),
    logout: () => A.signOut(auth),
    subscribe: cb => { listener = cb; },
    add(c, d) {
      const ref = F.doc(F.collection(db, c));
      guard(F.setDoc(ref, { ...d, createdAt: Date.now() }));
      return ref.id;
    },
    set: (c, id, d) => { guard(F.setDoc(F.doc(db, c, id), d)); },
    update: (c, id, d) => { guard(F.updateDoc(F.doc(db, c, id), d)); },
    remove: (c, id) => { guard(F.deleteDoc(F.doc(db, c, id))); },
  };
}

// Demo: lädt beim ersten Start die lokale Importdatei (Daten/fahrzeuge.json),
// falls vorhanden. Online gibt es diese Datei nicht, dann startet die Demo leer.
async function demoStore() {
  const KEY = "fuhrpark-demo-v6";
  let data = null;
  try { data = JSON.parse(localStorage.getItem(KEY)); } catch {}
  if (!data) {
    try {
      const res = await fetch("Daten/fahrzeuge.json", { cache: "no-store" });
      if (res.ok) data = await res.json();
    } catch {}
  }
  data = Object.fromEntries(COLS.map(c => [c, data?.[c] || []]));
  let listener = () => {};
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
    listener({ ...data }, true);
  };
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

  return {
    demo: true,
    onAuth(cb) { setTimeout(() => { cb({ email: "demo" }); listener({ ...data }, true); }, 0); },
    login: async () => {},
    logout: async () => { try { localStorage.removeItem(KEY); } catch {} location.reload(); },
    subscribe: cb => { listener = cb; },
    add(c, d) { const id = uid(); data[c] = [...data[c], { id, ...d, createdAt: Date.now() }]; save(); return id; },
    set(c, id, d) { data[c] = [...data[c].filter(x => x.id !== id), { id, ...d }]; save(); },
    update(c, id, d) { data[c] = data[c].map(x => (x.id === id ? { ...x, ...d } : x)); save(); },
    remove(c, id) { data[c] = data[c].filter(x => x.id !== id); save(); },
  };
}
