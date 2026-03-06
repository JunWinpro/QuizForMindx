import { useState, useEffect, useRef, useCallback } from "react";
import api from "../api/axios";

// ── Types ──────────────────────────────────────────────────────────────────

export interface QuizQuestion {
  cardId: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface QuizMeta {
  deckId: string;
  deckName: string;
  totalQuestions: number;
  totalCards: number;
}

export interface AnswerRecord {
  selectedIndex: number | null; // null = timeout (hết giờ)
  timeSpent: number;            // seconds
  isCorrect: boolean;
}

export interface UseQuizSessionOptions {
  deckId: string;
  count: number;
  timerEnabled: boolean;
  timerSeconds?: number;
}

export interface UseQuizSessionReturn {
  // Data
  questions: QuizQuestion[];
  meta: QuizMeta | null;
  currentIndex: number;
  currentQuestion: QuizQuestion | null;
  totalCount: number;
  // Current question state
  selectedIndex: number | null;
  isAnswered: boolean;
  // Timer
  timeLeft: number;
  // Session state
  isFinished: boolean;
  isSaving: boolean;
  loading: boolean;
  error: string | null;
  resultId: string | null;
  // Progress
  progress: number; // 0–100 (based on answered questions)
  correctCount: number;
  // Actions
  handleSelectAnswer: (index: number | null) => void;
  nextQuestion: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useQuizSession({
  deckId,
  count,
  timerEnabled,
  timerSeconds = 30,
}: UseQuizSessionOptions): UseQuizSessionReturn {
  const [questions, setQuestions]       = useState<QuizQuestion[]>([]);
  const [meta, setMeta]                 = useState<QuizMeta | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isFinished, setIsFinished]     = useState(false);
  const [isSaving, setIsSaving]         = useState(false);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [resultId, setResultId]         = useState<string | null>(null);
  const [timeLeft, setTimeLeft]         = useState(timerSeconds);

  // Refs (sync access in callbacks — tránh stale closure)
  const answersRef        = useRef<(AnswerRecord | null)[]>([]);
  const currentIndexRef   = useRef(0);
  const questionsRef      = useRef<QuizQuestion[]>([]);
  const metaRef           = useRef<QuizMeta | null>(null);
  const startTimeRef      = useRef(Date.now());
  const questionStartRef  = useRef(Date.now());
  const timerRef          = useRef<ReturnType<typeof setInterval> | null>(null);
  const isAnsweredRef     = useRef(false); // tránh double-submit trên timer

  // ── Computed ────────────────────────────────────────────────────────────
  const isAnswered  = selectedIndex !== null;
  const correctCount = answersRef.current.filter(a => a?.isCorrect).length;

  // ── Load questions ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!deckId) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/quiz/${deckId}/generate?count=${count}`);
        if (res.data?.success) {
          const qs: QuizQuestion[] = res.data.data;
          const m: QuizMeta = res.data.meta;
          setQuestions(qs);
          setMeta(m);
          questionsRef.current = qs;
          metaRef.current = m;
          answersRef.current = new Array(qs.length).fill(null);
          startTimeRef.current = Date.now();
          questionStartRef.current = Date.now();
        } else {
          setError("Không thể tạo câu hỏi quiz");
        }
      } catch (err: any) {
        setError(err?.response?.data?.message ?? "Lỗi kết nối server");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [deckId, count]);

  // ── Timer per question ───────────────────────────────────────────────────
  useEffect(() => {
    if (!timerEnabled || loading || isFinished || questions.length === 0) return;

    setTimeLeft(timerSeconds);
    isAnsweredRef.current = false;
    questionStartRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Auto-submit nếu chưa trả lời
          if (!isAnsweredRef.current) {
            isAnsweredRef.current = true;
            // Trigger timeout answer via timeout flag
            setSelectedIndex(-1); // -1 = timeout sentinel
            const timeSpent = Math.round((Date.now() - questionStartRef.current) / 1000);
            const idx = currentIndexRef.current;
            answersRef.current[idx] = {
              selectedIndex: null,
              timeSpent,
              isCorrect: false,
            };
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, loading, questions.length]);

  // ── Handle answer selection ──────────────────────────────────────────────
  const handleSelectAnswer = useCallback((index: number | null) => {
    if (isAnsweredRef.current) return; // prevent double-click
    isAnsweredRef.current = true;

    if (timerRef.current) clearInterval(timerRef.current);

    const timeSpent = Math.round((Date.now() - questionStartRef.current) / 1000);
    const ci = currentIndexRef.current;
    const q = questionsRef.current[ci];
    if (!q) return;

    const isCorrect = index !== null && index === q.correctIndex;
    answersRef.current[ci] = { selectedIndex: index, timeSpent, isCorrect };
    setSelectedIndex(index ?? -1);
  }, []);

  // ── Go to next question ──────────────────────────────────────────────────
  const nextQuestion = useCallback(() => {
    const ci = currentIndexRef.current;
    const total = questionsRef.current.length;

    if (ci + 1 >= total) {
      // Last question — finish quiz
      finishQuiz();
    } else {
      const next = ci + 1;
      currentIndexRef.current = next;
      setCurrentIndex(next);
      setSelectedIndex(null);
      isAnsweredRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Finish & save ────────────────────────────────────────────────────────
  const finishQuiz = useCallback(async () => {
    setIsFinished(true);
    setIsSaving(true);

    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    const qs = questionsRef.current;
    const answers = answersRef.current;
    const m = metaRef.current;

    const correct = answers.filter(a => a?.isCorrect).length;
    const score = qs.length > 0 ? Math.round((correct / qs.length) * 100) : 0;

    const wrongCards = qs
      .filter((q, i) => !answers[i]?.isCorrect)
      .map((q, i) => ({
        cardId: q.cardId,
        front: q.question,
        back: q.options[q.correctIndex],
        selectedAnswer:
          answers[i]?.selectedIndex != null && answers[i]!.selectedIndex! >= 0
            ? q.options[answers[i]!.selectedIndex!]
            : "(Hết giờ)",
        correctAnswer: q.options[q.correctIndex],
      }));

    try {
      const res = await api.post("/quiz/result", {
        deckId: m?.deckId ?? "",
        deckName: m?.deckName ?? "",
        score,
        correctCount: correct,
        totalQuestions: qs.length,
        duration,
        wrongCards,
      });
      if (res.data?.success) {
        setResultId(res.data.data._id);
      }
    } catch {
      // Silent — still show result even if save fails
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    questions,
    meta,
    currentIndex,
    currentQuestion: questions[currentIndex] ?? null,
    totalCount: questions.length,
    selectedIndex,
    isAnswered,
    timeLeft,
    isFinished,
    isSaving,
    loading,
    error,
    resultId,
    progress: questions.length > 0
      ? Math.round((currentIndex / questions.length) * 100)
      : 0,
    correctCount,
    handleSelectAnswer,
    nextQuestion,
  };
}