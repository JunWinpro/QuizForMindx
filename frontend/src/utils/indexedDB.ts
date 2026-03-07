/**
 * LexiLearn IndexedDB Utility — Native API (no external dependencies)
 * Handles offline card caching + write queue
 */

const DB_NAME = "lexilearn-db";
const DB_VERSION = 1;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface CachedCards {
  deckId: string;
  cards: any[];
  savedAt: number;
}

export interface QueuedRequest {
  id: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  payload: any;
  createdAt: number;
}

// ─────────────────────────────────────────────
// DB Helper — Native IndexedDB (no idb needed)
// ─────────────────────────────────────────────

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB not supported"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("cards")) {
        db.createObjectStore("cards", { keyPath: "deckId" });
      }
      if (!db.objectStoreNames.contains("writeQueue")) {
        db.createObjectStore("writeQueue", { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

// Promisify IDBRequest
function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror  = () => reject(request.error);
  });
}

// ─────────────────────────────────────────────
// PART 1 — Card Cache
// ─────────────────────────────────────────────

export function isCacheExpired(savedAt: number): boolean {
  return Date.now() - savedAt > CACHE_TTL_MS;
}

export async function saveCardsToCache(deckId: string, cards: any[]): Promise<void> {
  if (!deckId || !Array.isArray(cards) || cards.length === 0) return;

  try {
    const db = await openDatabase();
    const tx = db.transaction("cards", "readwrite");
    const store = tx.objectStore("cards");
    const entry: CachedCards = { deckId, cards, savedAt: Date.now() };
    await promisifyRequest(store.put(entry));
    db.close();
    console.info(`[Cache] Saved ${cards.length} cards for deck ${deckId}`);
  } catch (err) {
    console.warn("[Cache] Failed to save:", err);
  }
}

export async function getCachedCards(deckId: string): Promise<any[] | null> {
  if (!deckId) return null;

  try {
    const db = await openDatabase();
    const tx = db.transaction("cards", "readonly");
    const store = tx.objectStore("cards");
    const entry: CachedCards | undefined = await promisifyRequest(store.get(deckId));
    db.close();

    if (!entry) return null;

    if (isCacheExpired(entry.savedAt)) {
      // Delete expired entry in background
      clearDeckCache(deckId).catch(() => {});
      return null;
    }

    return entry.cards;
  } catch (err) {
    console.warn("[Cache] Failed to read:", err);
    return null;
  }
}

export async function clearDeckCache(deckId: string): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction("cards", "readwrite");
    await promisifyRequest(tx.objectStore("cards").delete(deckId));
    db.close();
  } catch (err) {
    console.warn("[Cache] Failed to clear deck:", err);
  }
}

// ─────────────────────────────────────────────
// PART 2 — Write Queue
// ─────────────────────────────────────────────

export async function enqueueRequest(
  endpoint: string,
  payload: any,
  method: QueuedRequest["method"] = "PUT"
): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction("writeQueue", "readwrite");
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const entry: QueuedRequest = { id, endpoint, method, payload, createdAt: Date.now() };
    await promisifyRequest(tx.objectStore("writeQueue").put(entry));
    db.close();
    console.info("[Queue] Enqueued:", endpoint);
  } catch (err) {
    console.warn("[Queue] Failed to enqueue:", err);
  }
}

export async function getPendingQueue(): Promise<QueuedRequest[]> {
  try {
    const db = await openDatabase();
    const tx = db.transaction("writeQueue", "readonly");
    const all: QueuedRequest[] = await promisifyRequest(tx.objectStore("writeQueue").getAll());
    db.close();
    return all ?? [];
  } catch {
    return [];
  }
}

export async function getQueueCount(): Promise<number> {
  try {
    const db = await openDatabase();
    const tx = db.transaction("writeQueue", "readonly");
    const count: number = await promisifyRequest(tx.objectStore("writeQueue").count());
    db.close();
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function processQueue(): Promise<void> {
  try {
    const queue = await getPendingQueue();
    if (queue.length === 0) return;

    console.info(`[Queue] Processing ${queue.length} queued request(s)...`);
    const token = localStorage.getItem("token");

    const db = await openDatabase();

    for (const req of queue) {
      try {
        const apiBase = (import.meta as any).env?.VITE_API_URL ?? "/api";
        const url = req.endpoint.startsWith("http")
          ? req.endpoint
          : `${apiBase}${req.endpoint}`;

        const res = await fetch(url, {
          method: req.method,
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: req.method !== "GET" ? JSON.stringify(req.payload) : undefined,
        });

        if (res.ok) {
          const tx = db.transaction("writeQueue", "readwrite");
          await promisifyRequest(tx.objectStore("writeQueue").delete(req.id));
          console.info("[Queue] Synced and removed:", req.endpoint);
        } else {
          console.warn("[Queue] Server rejected (will retry):", req.endpoint, res.status);
        }
      } catch (err) {
        console.warn("[Queue] Network error replaying:", req.endpoint, err);
      }
    }

    db.close();
  } catch (err) {
    console.warn("[Queue] processQueue error:", err);
  }
}

// ─────────────────────────────────────────────
// Auto process queue when back online
// ─────────────────────────────────────────────

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.info("[Queue] Back online — syncing queued requests...");
    processQueue();
  });
}