/**
 * useOfflineStudy — Fixed version
 *
 * Fixes:
 * 1. Tries multiple API endpoints to find cards
 * 2. Handles different response formats (array vs object)
 * 3. Caches even when cards come from /decks/:id/cards (not just study session)
 * 4. Better error handling with detailed logging
 */

import { useCallback } from "react";
import api from "../api/axios";
import {
  saveCardsToCache,
  getCachedCards,
  enqueueRequest,
} from "../utils/indexedDB";

// Extract cards array from any known API response shape
function extractCards(data: any): any[] | null {
  if (!data) return null;

  // Shape 1: { success: true, data: [...] }
  if (data.success && Array.isArray(data.data) && data.data.length > 0) {
    return data.data;
  }

  // Shape 2: { success: true, data: { cards: [...] } }
  if (data.success && data.data?.cards && Array.isArray(data.data.cards) && data.data.cards.length > 0) {
    return data.data.cards;
  }

  // Shape 3: direct array
  if (Array.isArray(data) && data.length > 0) {
    return data;
  }

  return null;
}

export function useOfflineStudy() {
  /**
   * Fetch cards for a study session.
   * Strategy:
   *   1. Try /study/:deckId/session (SRS-aware, due cards first)
   *   2. Try /decks/:deckId/cards  (fallback - all cards)
   *   3. Try IndexedDB cache       (offline fallback)
   */
  const fetchCards = useCallback(
    async (deckId: string): Promise<{ cards: any[]; fromCache: boolean }> => {
      if (!deckId) throw new Error("deckId is required");

      // ── 1. Try study session endpoint ─────────────────────────────────────
      if (navigator.onLine) {
        try {
          const res = await api.get(`/study/${deckId}/session`);
          const cards = extractCards(res.data);

          if (cards && cards.length > 0) {
            await saveCardsToCache(deckId, cards);
            return { cards, fromCache: false };
          }

          // Study session returned empty (no due cards) — fall through to all cards
          console.info("[useOfflineStudy] Study session empty, trying all cards...");
        } catch (err) {
          console.warn("[useOfflineStudy] /study session failed:", err);
        }

        // ── 2. Try deck cards endpoint (all cards) ──────────────────────────
        try {
          const res = await api.get(`/decks/${deckId}/cards`);
          const cards = extractCards(res.data);

          if (cards && cards.length > 0) {
            await saveCardsToCache(deckId, cards);
            return { cards, fromCache: false };
          }
        } catch (err) {
          console.warn("[useOfflineStudy] /decks cards failed:", err);
        }
      }

      // ── 3. Offline or both failed: try IndexedDB cache ────────────────────
      console.info("[useOfflineStudy] Trying IndexedDB cache for deck:", deckId);
      const cached = await getCachedCards(deckId);

      if (cached && cached.length > 0) {
        console.info(`[useOfflineStudy] Loaded ${cached.length} cards from cache`);
        return { cards: cached, fromCache: true };
      }

      // ── Nothing worked ────────────────────────────────────────────────────
      if (!navigator.onLine) {
        throw new Error(
          "Bạn đang offline và chưa có cache cho deck này. " +
          "Vui lòng kết nối mạng để tải thẻ lần đầu."
        );
      }

      throw new Error("Không tìm thấy thẻ nào trong deck này.");
    },
    []
  );

  /**
   * Submit SRS batch update.
   * Queues to IndexedDB if offline.
   */
  const submitBatch = useCallback(
    async (updates: { cardId: string; quality: number }[]): Promise<boolean> => {
      if (!updates || updates.length === 0) return true;

      try {
        await api.put("/srs/update-batch", { updates });
        return true;
      } catch (err: any) {
        const isOffline = !navigator.onLine || err?.code === "ERR_NETWORK" || err?.message === "Network Error";
        if (isOffline) {
          await enqueueRequest("/srs/update-batch", { updates }, "PUT");
          console.info("[useOfflineStudy] SRS batch queued for later sync");
          return false;
        }
        throw err;
      }
    },
    []
  );

  /**
   * Pre-cache cards for a deck (call when viewing deck detail page).
   * Silent — does not throw.
   */
  const preCacheCards = useCallback(async (deckId: string, cards: any[]): Promise<void> => {
    if (!deckId || !cards || cards.length === 0) return;
    await saveCardsToCache(deckId, cards);
  }, []);

  return { fetchCards, submitBatch, preCacheCards };
}