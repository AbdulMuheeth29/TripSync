// Lightweight IndexedDB helpers for per-trip offline caching and flags.
// Designed to fail gracefully if IndexedDB is unavailable.

const DB_NAME = "tripsync-offline";
const DB_VERSION = 1;
const STORE_TRIPS = "trips";
const STORE_FLAGS = "flags";

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_TRIPS)) {
        db.createObjectStore(STORE_TRIPS);
      }
      if (!db.objectStoreNames.contains(STORE_FLAGS)) {
        db.createObjectStore(STORE_FLAGS);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveOfflineTrip(tripId: string, data: unknown): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_TRIPS, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(STORE_TRIPS).put(data, tripId);
  });
}

export async function loadOfflineTrip<T = unknown>(tripId: string): Promise<T | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise<T | null>((resolve, reject) => {
    const tx = db.transaction(STORE_TRIPS, "readonly");
    tx.onerror = () => reject(tx.error);
    const req = tx.objectStore(STORE_TRIPS).get(tripId);
    req.onsuccess = () => resolve((req.result as T) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function setTripOfflineEnabled(tripId: string, enabled: boolean): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_FLAGS, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    const store = tx.objectStore(STORE_FLAGS);
    if (enabled) {
      store.put(true, tripId);
    } else {
      store.delete(tripId);
    }
  });
}

export async function isTripOfflineEnabled(tripId: string): Promise<boolean> {
  const db = await openDb();
  if (!db) return false;
  return new Promise<boolean>((resolve, reject) => {
    const tx = db.transaction(STORE_FLAGS, "readonly");
    tx.onerror = () => reject(tx.error);
    const req = tx.objectStore(STORE_FLAGS).get(tripId);
    req.onsuccess = () => resolve(Boolean(req.result));
    req.onerror = () => reject(req.error);
  });
}

export async function listOfflineTripIds(): Promise<string[]> {
  const db = await openDb();
  if (!db) return [];
  return new Promise<string[]>((resolve, reject) => {
    const tx = db.transaction(STORE_FLAGS, "readonly");
    tx.onerror = () => reject(tx.error);
    const store = tx.objectStore(STORE_FLAGS);
    const keys: string[] = [];
    const req = store.openKeyCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) {
        resolve(keys);
        return;
      }
      keys.push(String(cursor.key));
      cursor.continue();
    };
    req.onerror = () => reject(req.error);
  });
}

