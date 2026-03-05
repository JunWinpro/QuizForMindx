import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";

// ── Types ──────────────────────────────────────────────────────────────────

export interface StudyCard {
  _id: string;
  front: string;
  back: string;
  example?: string;
  phonetic?: string;
  audioUrl?: string;
  imageUrl?: string;
  deckId?: string;
  _srsDue?: boolean;
  _srsInterval?: number;
}

export interface SrsResult {
  cardId: string;
  quality: number; // known=4 | unknown=1 | skip=2
}

export interface UseStudySessionOptions {
  /** Không fetch API cho đến khi enabled=true. Default: true */
  enabled?: boolean;
  /** Nếu truyền, dùng mảng này thay vì gọi API session */
  overrideCards?: StudyCard[];
}

export interface UseStudySessionReturn {
  cards: StudyCard[];
  currentCard: StudyCard | null;
  currentIndex: number;
  isFlipped: boolean;
  isFinished: boolean;
  loading: boolean;
  error: string | null;
  total: number;
  answered: number;
  progress: number;
  known: StudyCard[];
  unknown: StudyCard[];
  skipped: StudyCard[];
  srsResults: SrsResult[];   // ← Stage 6: dùng để submit lên /api/srs/update-batch
  dueCount: number;
  flipCard: () => void;
  markKnown: () => void;
  markUnknown: () => void;
  skipCard: () => void;
  restartSession: () => void;
  restartWithUnknown: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useStudySession(
  deckId: string | undefined,
  options: UseStudySessionOptions = {}
): UseStudySessionReturn {
  const { enabled = true, overrideCards } = options;

  const [cards, setCards]               = useState<StudyCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped]       = useState(false);
  const [isFinished, setIsFinished]     = useState(false);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [known, setKnown]               = useState<StudyCard[]>([]);
  const [unknown, setUnknown]           = useState<StudyCard[]>([]);
  const [skipped, setSkipped]           = useState<StudyCard[]>([]);
  const [srsResults, setSrsResults]     = useState<SrsResult[]>([]);
  const [dueCount, setDueCount]         = useState(0);

  // ── Reset toàn bộ session state ─────────────────────────────────────────
  const resetStudyState = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
    setKnown([]);
    setUnknown([]);
    setSkipped([]);
    setSrsResults([]);
  }, []);

  // ── Fetch từ API ─────────────────────────────────────────────────────────
  const loadFromAPI = useCallback(async () => {
    if (!deckId || !enabled) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    resetStudyState();
    try {
      // Init SRS records cho deck (idempotent)
      await api.post(`/study/${deckId}/init-srs`).catch(() => null);
      const res = await api.get(`/study/${deckId}/session`);
      if (res.data?.success) {
        setCards(res.data.data ?? []);
        setDueCount(res.data.dueCount ?? 0);
      } else {
        setError("Không thể tải phiên học");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  }, [deckId, enabled, resetStudyState]);

  // ── Effect: reload khi config thay đổi ──────────────────────────────────
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    if (overrideCards !== undefined) {
      // Dùng override cards (chế độ "chỉ ôn due")
      setCards(overrideCards);
      setDueCount(overrideCards.filter(c => c._srsDue).length);
      setLoading(false);
      resetStudyState();
    } else {
      loadFromAPI();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId, enabled, overrideCards]);

  // ── Navigation ───────────────────────────────────────────────────────────
  const goNext = useCallback((idx: number) => {
    if (idx + 1 >= cards.length) {
      setIsFinished(true);
    } else {
      setCurrentIndex(idx + 1);
      setIsFlipped(false);
    }
  }, [cards.length]);

  const flipCard = useCallback(() => setIsFlipped(f => !f), []);

  const markKnown = useCallback(() => {
    const card = cards[currentIndex];
    if (!card) return;
    setKnown(k => [...k, card]);
    setSrsResults(r => [...r, { cardId: card._id, quality: 4 }]);
    goNext(currentIndex);
  }, [cards, currentIndex, goNext]);

  const markUnknown = useCallback(() => {
    const card = cards[currentIndex];
    if (!card) return;
    setUnknown(u => [...u, card]);
    setSrsResults(r => [...r, { cardId: card._id, quality: 1 }]);
    goNext(currentIndex);
  }, [cards, currentIndex, goNext]);

  const skipCard = useCallback(() => {
    const card = cards[currentIndex];
    if (!card) return;
    setSkipped(s => [...s, card]);
    setSrsResults(r => [...r, { cardId: card._id, quality: 2 }]);
    goNext(currentIndex);
  }, [cards, currentIndex, goNext]);

  const restartSession = useCallback(() => {
    setCards(c => shuffle([...c]));
    resetStudyState();
  }, [resetStudyState]);

  const restartWithUnknown = useCallback(() => {
    setCards(shuffle([...unknown]));
    resetStudyState();
  }, [unknown, resetStudyState]);

  const answered = known.length + unknown.length + skipped.length;
  const total    = cards.length;

  return {
    cards,
    currentCard:  cards[currentIndex] ?? null,
    currentIndex,
    isFlipped,
    isFinished,
    loading,
    error,
    total,
    answered,
    progress: total > 0 ? Math.round((answered / total) * 100) : 0,
    known,
    unknown,
    skipped,
    srsResults,
    dueCount,
    flipCard,
    markKnown,
    markUnknown,
    skipCard,
    restartSession,
    restartWithUnknown,
  };
}