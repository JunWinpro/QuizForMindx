import { useState, useCallback, useEffect } from "react";
import api from "../api/axios";
const isValidObjectId = (id?: string) => !!id && /^[a-f\d]{24}$/i.test(id);
// ── Types ──────────────────────────────────────────────────────────────────

export interface SrsResult {
  cardId: string;
  quality: number; // 0-5  (known→4, unknown→1, skip→2)
}

export interface ScheduleDay {
  date: string; // "YYYY-MM-DD"
  count: number;
}

export interface SrsDueCard {
  _id: string;
  front: string;
  back: string;
  example?: string;
  phonetic?: string;
  audioUrl?: string;
  imageUrl?: string;
  deckId?: string;
  _srsInterval: number;
  _srsDue: true;
  _nextReview: string;
  _lastReview?: string | null;
}

interface UseSRSReturn {
  dueCards: SrsDueCard[];
  dueCount: number;
  dueLoading: boolean;
  schedule: ScheduleDay[];
  scheduleLoading: boolean;
  submitResults: (results: SrsResult[]) => Promise<{ success: boolean }>;
  loadDueCards: (deckId?: string) => Promise<void>;
  loadSchedule: (deckId?: string) => Promise<void>;
}

// ── Hook ──────────────────────────────────────────────────────────────────

/**
 * useSRS(deckId?)
 *
 * Nếu truyền deckId → auto-load due cards cho deck đó khi mount.
 * Không truyền deckId → gọi loadDueCards() thủ công (dùng cho Navbar global badge).
 */
export function useSRS(deckId?: string): UseSRSReturn {
  const [dueCards, setDueCards] = useState<SrsDueCard[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [dueLoading, setDueLoading] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // ── GET /api/srs/due?deckId= ─────────────────────────────────────────────
  const loadDueCards = useCallback(
    async (id?: string) => {
      setDueLoading(true);
      try {
        const effectiveId = id ?? deckId;
        const params = isValidObjectId(effectiveId)
          ? `?deckId=${effectiveId}`
          : "";
        const res = await api.get(`/srs/due${params}`);
        if (res.data?.success) {
          setDueCards(res.data.data ?? []);
          setDueCount(res.data.dueCount ?? 0);
        }
      } catch {
        // silent – user chưa đăng nhập hoặc network lỗi
      } finally {
        setDueLoading(false);
      }
    },
    [deckId],
  );

  // ── GET /api/srs/schedule?deckId= ───────────────────────────────────────
  const loadSchedule = useCallback(
    async (id?: string) => {
      setScheduleLoading(true);
      try {
        const effectiveId = id ?? deckId;
        const params = isValidObjectId(effectiveId)
          ? `?deckId=${effectiveId}`
          : "";
        const res = await api.get(`/srs/schedule${params}`);
        if (res.data?.success) {
          setSchedule(res.data.data ?? []);
        }
      } catch {
        // silent
      } finally {
        setScheduleLoading(false);
      }
    },
    [deckId],
  );

  // ── PUT /api/srs/update-batch ────────────────────────────────────────────
  const submitResults = useCallback(async (results: SrsResult[]) => {
    if (!results.length) return { success: true };
    try {
      const res = await api.put("/srs/update-batch", { results });
      return { success: res.data?.success ?? false };
    } catch {
      return { success: false };
    }
  }, []);

  // Auto-load khi deckId thay đổi
  useEffect(() => {
    if (deckId) {
      loadDueCards(deckId);
    }
  }, [deckId, loadDueCards]);

  return {
    dueCards,
    dueCount,
    dueLoading,
    schedule,
    scheduleLoading,
    submitResults,
    loadDueCards,
    loadSchedule,
  };
}
