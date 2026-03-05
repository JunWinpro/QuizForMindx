import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useStudySession } from "../hooks/Usestudysession";
import FlashcardFlip from "../components/Flashcardflip";
import StudyControls from "../components/Studycontrols";
import SessionSummary from "../components/Sessionsummary";
import { playGoogleTTS } from "../utils/tts";

interface DeckMeta {
  name: string;
  language: string;
  frontLanguage: string;
  backLanguage: string;
  cardCount: number;
}

// TTS helper
const LANG_MAP: Record<string, string> = {
  en: "en-US", ja: "ja-JP", fr: "fr-FR",
  zh: "zh-CN", de: "de-DE", ko: "ko-KR",
  vi: "vi-VN",
};

function playTTS(text: string, lang: string) {
  playGoogleTTS(text, lang);
}

export default function StudyPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();

  const [deckMeta, setDeckMeta] = useState<DeckMeta | null>(null);
  const [autoPlay, setAutoPlay] = useState(true);
  const prevFlipped = useRef(false);

  const session = useStudySession(deckId);

  // Load deck meta
  useEffect(() => {
    if (!deckId) return;
    api.get(`/decks/${deckId}`)
      .then(res => {
        if (res.data?.success) setDeckMeta(res.data.data);
      })
      .catch(() => null);
  }, [deckId]);

  // Auto-play audio when card flips to back
  useEffect(() => {
    if (!autoPlay) return;
    if (session.isFlipped && !prevFlipped.current && session.currentCard) {
      // Play audio URL if available, else TTS
      const card = session.currentCard;
      if ((card as any).audioUrl) {
        const audio = new Audio((card as any).audioUrl);
        audio.play().catch(() => null);
      } else {
        playTTS(card.back, deckMeta?.backLanguage || "vi");
      }
    }
    prevFlipped.current = session.isFlipped;
  }, [session.isFlipped, session.currentCard, deckMeta, autoPlay]);

  // ── Loading state ──
  if (session.loading) {
    return (
      <div style={{ minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
        <div style={{ width: 48, height: 48, border: "4px solid var(--cream-2)", borderTopColor: "var(--navy)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "var(--muted)", fontSize: 15 }}>Đang tải phiên học…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Error state ──
  if (session.error) {
    return (
      <div style={{ minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 48 }}>😕</div>
        <h2 style={{ fontFamily: "'Fraunces', serif", color: "var(--navy)" }}>Không thể tải phiên học</h2>
        <p style={{ color: "var(--muted)" }}>{session.error}</p>
        <button onClick={() => navigate(-1)} style={{ background: "var(--navy)", color: "white", border: "none", borderRadius: 12, padding: "10px 24px", fontWeight: 700, cursor: "pointer" }}>
          ← Quay lại
        </button>
      </div>
    );
  }

  // ── Empty deck ──
  if (session.total === 0 && !session.loading) {
    return (
      <div style={{ minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 48 }}>📭</div>
        <h2 style={{ fontFamily: "'Fraunces', serif", color: "var(--navy)" }}>Bộ thẻ này chưa có từ nào</h2>
        <Link to={`/decks/${deckId}/manage`} style={{ background: "var(--navy)", color: "white", borderRadius: 12, padding: "10px 24px", fontWeight: 700, textDecoration: "none" }}>
          + Thêm thẻ ngay
        </Link>
      </div>
    );
  }

  // ── Session finished ──
  if (session.isFinished) {
    return (
      <div style={{ minHeight: "calc(100vh - 64px)", padding: "40px 24px", background: "var(--cream, #f8f6f0)" }}>
        <SessionSummary
          known={session.known}
          unknown={session.unknown}
          total={session.total}
          deckId={deckId!}
          deckName={deckMeta?.name}
          onRestartAll={session.restartSession}
          onRestartUnknown={session.restartWithUnknown}
        />
      </div>
    );
  }

  const card = session.currentCard;
  if (!card) return null;

  return (
    <div style={{
      minHeight: "calc(100vh - 64px)",
      background: "var(--cream, #f8f6f0)",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* ── Top bar ── */}
      <div style={{
        background: "white",
        borderBottom: "1.5px solid var(--border)",
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ border: "none", background: "transparent", color: "var(--muted)", cursor: "pointer", fontFamily: "'Outfit', sans-serif", fontSize: 14, display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}
        >
          ← Thoát
        </button>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 16, color: "var(--navy)" }}>
            {deckMeta?.name || "Phiên học"}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            {session.answered}/{session.total} đã trả lời
          </div>
        </div>

        {/* Auto-play toggle */}
        <button
          onClick={() => setAutoPlay(a => !a)}
          title={autoPlay ? "Tắt tự động phát âm" : "Bật tự động phát âm"}
          style={{
            border: "1.5px solid var(--border)",
            background: autoPlay ? "var(--navy)" : "transparent",
            color: autoPlay ? "white" : "var(--muted)",
            borderRadius: 8,
            padding: "6px 12px",
            fontSize: 13,
            cursor: "pointer",
            fontWeight: 600,
            fontFamily: "'Outfit', sans-serif",
            transition: "all .2s",
          }}
        >
          🔊 {autoPlay ? "Bật" : "Tắt"}
        </button>
      </div>

      {/* ── Main content ── */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
        gap: 40,
      }}>

        {/* Card counter pills */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#00C896", background: "rgba(0,200,150,.1)", padding: "3px 10px", borderRadius: 20 }}>
            ✅ {session.known.length} biết
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#e05252", background: "rgba(255,107,107,.08)", padding: "3px 10px", borderRadius: 20 }}>
            ❌ {session.unknown.length} chưa biết
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", background: "var(--cream-2)", padding: "3px 10px", borderRadius: 20 }}>
            📇 {session.total - session.answered} còn lại
          </span>
        </div>

        {/* Flashcard */}
        <div className="animate-fade-up" style={{ width: "100%", maxWidth: 600 }}>
          <FlashcardFlip
            card={card}
            isFlipped={session.isFlipped}
            language={deckMeta?.language}
            onFlip={session.flipCard}
          />
        </div>

        {/* TTS manual button */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => {
              if ((card as any).audioUrl) {
                new Audio((card as any).audioUrl).play().catch(() => null);
              } else if (session.isFlipped) {
                playTTS(card.back, deckMeta?.backLanguage || "vi");
              } else {
                playTTS(card.front, deckMeta?.frontLanguage || "en");
              }
            }}
            style={{
              border: "1.5px solid var(--border)",
              background: "white",
              borderRadius: 10,
              padding: "8px 16px",
              fontSize: 13,
              color: "var(--muted)",
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            🔊 Nghe phát âm
          </button>
        </div>

        {/* Controls */}
        <StudyControls
          isFlipped={session.isFlipped}
          currentIndex={session.currentIndex}
          total={session.total}
          progress={session.progress}
          onFlip={session.flipCard}
          onKnown={session.markKnown}
          onUnknown={session.markUnknown}
          onSkip={session.skipCard}
        />
      </div>
    </div>
  );
}