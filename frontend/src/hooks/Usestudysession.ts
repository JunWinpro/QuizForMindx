import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import type { Card } from "../types/card";

export interface StudyCard extends Card {
  phonetic?: string;
  audioUrl?: string;
  example?: string;
}

interface StudySessionState {
  cards: StudyCard[];
  currentIndex: number;
  isFlipped: boolean;
  known: StudyCard[];
  unknown: StudyCard[];
  isFinished: boolean;
  loading: boolean;
  error: string | null;
}

interface UseStudySessionReturn extends StudySessionState {
  currentCard: StudyCard | null;
  progress: number; // 0-100
  total: number;
  answered: number;
  flipCard: () => void;
  markKnown: () => void;
  markUnknown: () => void;
  skipCard: () => void;
  restartSession: () => void;
  restartWithUnknown: () => void;
}

export function useStudySession(deckId: string | undefined): UseStudySessionReturn {
  const [state, setState] = useState<StudySessionState>({
    cards: [],
    currentIndex: 0,
    isFlipped: false,
    known: [],
    unknown: [],
    isFinished: false,
    loading: true,
    error: null,
  });

  const loadSession = useCallback(async (cardList?: StudyCard[]) => {
    if (!deckId) return;
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      // Init SRS first (idempotent)
      await api.post(`/study/${deckId}/init-srs`).catch(() => null);

      let cards: StudyCard[];
      if (cardList) {
        cards = cardList;
      } else {
        const res = await api.get(`/study/${deckId}/session`);
        cards = res.data?.data || [];
      }

      setState({
        cards,
        currentIndex: 0,
        isFlipped: false,
        known: [],
        unknown: [],
        isFinished: cards.length === 0,
        loading: false,
        error: null,
      });
    } catch (err: any) {
      setState(s => ({
        ...s,
        loading: false,
        error: err?.response?.data?.message || "Không thể tải phiên học",
      }));
    }
  }, [deckId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const advance = useCallback((markAs: "known" | "unknown" | "skip") => {
    setState(s => {
      const card = s.cards[s.currentIndex];
      const nextIndex = s.currentIndex + 1;
      const isFinished = nextIndex >= s.cards.length;

      return {
        ...s,
        isFlipped: false,
        currentIndex: nextIndex,
        isFinished,
        known: markAs === "known" && card ? [...s.known, card] : s.known,
        unknown: markAs === "unknown" && card ? [...s.unknown, card] : s.unknown,
      };
    });
  }, []);

  const flipCard = useCallback(() => {
    setState(s => ({ ...s, isFlipped: !s.isFlipped }));
  }, []);

  const markKnown = useCallback(() => advance("known"), [advance]);
  const markUnknown = useCallback(() => advance("unknown"), [advance]);
  const skipCard = useCallback(() => advance("skip"), [advance]);

  const restartSession = useCallback(() => {
    loadSession();
  }, [loadSession]);

  const restartWithUnknown = useCallback(() => {
    setState(s => {
      if (s.unknown.length === 0) return s;
      return {
        ...s,
        cards: [...s.unknown],
        currentIndex: 0,
        isFlipped: false,
        known: [],
        unknown: [],
        isFinished: false,
      };
    });
  }, []);

  const currentCard = state.cards[state.currentIndex] ?? null;
  const total = state.cards.length;
  const answered = state.known.length + state.unknown.length;
  const progress = total > 0 ? Math.round((answered / total) * 100) : 0;

  return {
    ...state,
    currentCard,
    progress,
    total,
    answered,
    flipCard,
    markKnown,
    markUnknown,
    skipCard,
    restartSession,
    restartWithUnknown,
  };
}