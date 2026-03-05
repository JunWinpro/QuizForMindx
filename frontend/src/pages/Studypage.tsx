import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useStudySession } from "../hooks/Usestudysession";
import { useSRS } from "../hooks/UseSRS";
import FlashcardFlip from "../components/Flashcardflip";
import StudyControls from "../components/Studycontrols";
import SessionSummary from "../components/Sessionsummary";
import DueCardsBadge from "../components/DueCardsBadge";
import { playGoogleTTS } from "../utils/tts";

// ── Types ────────────────────────────────────────────────────────────────

interface DeckMeta {
  name: string;
  language: string;
  frontLanguage: string;
  backLanguage: string;
  cardCount: number;
}

type StudyMode = "all" | "due";

// ── TTS helper ────────────────────────────────────────────────────────────

function playTTS(text: string, lang: string) {
  playGoogleTTS(text, lang);
}

// ── Spinner ───────────────────────────────────────────────────────────────

function Spinner({ label = "Đang tải…" }: { label?: string }) {
  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          border: "4px solid var(--cream-2)",
          borderTopColor: "var(--navy)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p style={{ color: "var(--muted)", fontSize: 15 }}>{label}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Mode Selection Screen ─────────────────────────────────────────────────

interface ModeSelectorProps {
  deckMeta: DeckMeta | null;
  deckId: string;
  dueCount: number;
  dueLoading: boolean;
  onSelect: (mode: StudyMode) => void;
}

function ModeSelector({
  deckMeta,
  deckId,
  dueCount,
  dueLoading,
  onSelect,
}: ModeSelectorProps) {
  const navigate = useNavigate();
  useEffect(() => {
    if (deckId && !/^[a-f\d]{24}$/i.test(deckId)) {
      navigate("/schedule", { replace: true });
    }
  }, [deckId, navigate]);
  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px)",
        background: "var(--cream, #f8f6f0)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      <div
        className="animate-fade-up"
        style={{ maxWidth: 480, width: "100%", textAlign: "center" }}
      >
        {/* Deck info */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              fontFamily: "'Fraunces', serif",
              fontWeight: 700,
              fontSize: "clamp(22px,4vw,32px)",
              color: "var(--navy)",
              marginBottom: 8,
            }}
          >
            {deckMeta?.name || "Phiên học"}
          </div>
          <div style={{ fontSize: 14, color: "var(--muted)" }}>
            📇 {deckMeta?.cardCount ?? "…"} thẻ ·{" "}
            {deckMeta?.language?.toUpperCase()}
          </div>
        </div>

        {/* Due info */}
        {dueLoading ? (
          <div
            style={{
              background: "white",
              border: "1.5px solid var(--border)",
              borderRadius: 16,
              padding: "20px",
              marginBottom: 28,
            }}
          >
            <div
              className="skeleton"
              style={{
                height: 24,
                width: "60%",
                margin: "0 auto",
                borderRadius: 8,
              }}
            />
          </div>
        ) : dueCount > 0 ? (
          <div
            style={{
              background: "rgba(255,107,107,.06)",
              border: "1.5px solid rgba(255,107,107,.25)",
              borderRadius: 16,
              padding: "16px 20px",
              marginBottom: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 20 }}>📅</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#e05252" }}>
              {dueCount} từ cần ôn hôm nay
            </span>
            <DueCardsBadge count={dueCount} />
          </div>
        ) : (
          <div
            style={{
              background: "rgba(0,200,150,.06)",
              border: "1.5px solid rgba(0,200,150,.2)",
              borderRadius: 16,
              padding: "14px 20px",
              marginBottom: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 18 }}>🎉</span>
            <span
              style={{ fontWeight: 600, fontSize: 14, color: "var(--emerald)" }}
            >
              Không có từ nào cần ôn hôm nay
            </span>
          </div>
        )}

        {/* Mode buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {dueCount > 0 && (
            <button
              onClick={() => onSelect("due")}
              style={{
                background: "var(--navy)",
                color: "white",
                border: "none",
                borderRadius: 14,
                padding: "16px 24px",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'Outfit', sans-serif",
                boxShadow: "0 8px 24px rgba(13,27,42,.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              🎯 Ôn {dueCount} từ cần ôn hôm nay
              <DueCardsBadge count={dueCount} size="sm" />
            </button>
          )}

          <button
            onClick={() => onSelect("all")}
            style={{
              background: dueCount > 0 ? "white" : "var(--navy)",
              color: dueCount > 0 ? "var(--navy)" : "white",
              border: dueCount > 0 ? "1.5px solid var(--border)" : "none",
              borderRadius: 14,
              padding: "16px 24px",
              fontSize: 15,
              fontWeight: dueCount > 0 ? 600 : 700,
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
              boxShadow:
                dueCount > 0 ? "none" : "0 8px 24px rgba(13,27,42,.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            📚 Học toàn bộ {deckMeta?.cardCount ?? ""} thẻ
          </button>

          <button
            onClick={() => navigate(-1)}
            style={{
              background: "transparent",
              color: "var(--muted)",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              fontFamily: "'Outfit', sans-serif",
              marginTop: 4,
            }}
          >
            ← Quay lại
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SRS Submit result ─────────────────────────────────────────────────────

function SrsSubmittingOverlay() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(255,255,255,.85)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: "4px solid var(--cream-2)",
          borderTopColor: "var(--emerald)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p style={{ color: "var(--navy)", fontWeight: 600, fontSize: 15 }}>
        🧠 Đang cập nhật lịch ôn tập…
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────

export default function StudyPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();

  const [deckMeta, setDeckMeta] = useState<DeckMeta | null>(null);
  const [autoPlay, setAutoPlay] = useState(true);
  const [studyMode, setStudyMode] = useState<StudyMode | null>(null);
  const [srsSubmitting, setSrsSubmitting] = useState(false);
  const [srsSubmitted, setSrsSubmitted] = useState(false);
  const prevFlipped = useRef(false);

  // SRS hook – tải due count cho deck này
  const srs = useSRS(deckId);

  // Study session – chỉ bắt đầu khi studyMode được chọn
  const session = useStudySession(deckId, {
    enabled: studyMode !== null,
    overrideCards: studyMode === "due" ? (srs.dueCards as any) : undefined,
  });

  // ── Load deck meta ────────────────────────────────────────────────────
  useEffect(() => {
    if (!deckId) return;
    api
      .get(`/decks/${deckId}`)
      .then((res) => {
        if (res.data?.success) setDeckMeta(res.data.data);
      })
      .catch(() => null);
  }, [deckId]);

  // ── Submit SRS results khi session kết thúc (chỉ 1 lần) ──────────────
  useEffect(() => {
    if (
      session.isFinished &&
      !srsSubmitted &&
      !srsSubmitting &&
      session.srsResults.length > 0
    ) {
      setSrsSubmitting(true);
      srs.submitResults(session.srsResults).finally(() => {
        setSrsSubmitting(false);
        setSrsSubmitted(true);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.isFinished]);

  // Reset srsSubmitted khi restart
  const handleRestartAll = () => {
    setSrsSubmitted(false);
    setSrsSubmitting(false);
    session.restartSession();
  };
  const handleRestartUnknown = () => {
    setSrsSubmitted(false);
    setSrsSubmitting(false);
    session.restartWithUnknown();
  };

  // ── Auto-play TTS khi lật sang mặt sau ───────────────────────────────
  useEffect(() => {
    if (!autoPlay) return;
    if (session.isFlipped && !prevFlipped.current && session.currentCard) {
      const card = session.currentCard;
      if ((card as any).audioUrl) {
        new Audio((card as any).audioUrl).play().catch(() => null);
      } else {
        playTTS(card.back, deckMeta?.backLanguage || "vi");
      }
    }
    prevFlipped.current = session.isFlipped;
  }, [session.isFlipped, session.currentCard, deckMeta, autoPlay]);

  // ── STATE: Chưa chọn mode ─────────────────────────────────────────────
  if (studyMode === null) {
    // Đợi meta + due count load xong mới hiện mode selector
    if (!deckMeta || srs.dueLoading) return <Spinner label="Đang chuẩn bị…" />;
    return (
      <ModeSelector
        deckMeta={deckMeta}
        deckId={deckId!}
        dueCount={srs.dueCount}
        dueLoading={srs.dueLoading}
        onSelect={setStudyMode}
      />
    );
  }

  // ── STATE: Loading session ────────────────────────────────────────────
  if (session.loading) return <Spinner />;

  // ── STATE: Error ──────────────────────────────────────────────────────
  if (session.error) {
    return (
      <div
        style={{
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
          padding: 24,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 48 }}>😕</div>
        <h2 style={{ fontFamily: "'Fraunces', serif", color: "var(--navy)" }}>
          Không thể tải phiên học
        </h2>
        <p style={{ color: "var(--muted)" }}>{session.error}</p>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "var(--navy)",
            color: "white",
            border: "none",
            borderRadius: 12,
            padding: "10px 24px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ← Quay lại
        </button>
      </div>
    );
  }

  // ── STATE: Empty deck ─────────────────────────────────────────────────
  if (session.total === 0) {
    return (
      <div
        style={{
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
          padding: 24,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 48 }}>{studyMode === "due" ? "🎉" : "📭"}</div>
        <h2 style={{ fontFamily: "'Fraunces', serif", color: "var(--navy)" }}>
          {studyMode === "due"
            ? "Không có từ nào cần ôn hôm nay!"
            : "Bộ thẻ này chưa có từ nào"}
        </h2>
        {studyMode === "due" ? (
          <button
            onClick={() => setStudyMode("all")}
            style={{
              background: "var(--navy)",
              color: "white",
              border: "none",
              borderRadius: 12,
              padding: "10px 24px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            📚 Học toàn bộ thẻ
          </button>
        ) : (
          <Link
            to={`/decks/${deckId}/manage`}
            style={{
              background: "var(--navy)",
              color: "white",
              borderRadius: 12,
              padding: "10px 24px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            + Thêm thẻ ngay
          </Link>
        )}
      </div>
    );
  }

  // ── STATE: Finished ───────────────────────────────────────────────────
  if (session.isFinished) {
    return (
      <div
        style={{
          minHeight: "calc(100vh - 64px)",
          padding: "40px 24px",
          background: "var(--cream, #f8f6f0)",
          position: "relative",
        }}
      >
        {srsSubmitting && <SrsSubmittingOverlay />}
        {srsSubmitted && (
          <div
            style={{
              maxWidth: 480,
              margin: "0 auto 16px",
              background: "rgba(0,200,150,.08)",
              border: "1px solid rgba(0,200,150,.3)",
              borderRadius: 12,
              padding: "10px 16px",
              fontSize: 13,
              color: "var(--emerald)",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            ✅ Đã cập nhật lịch ôn tập SRS thành công
          </div>
        )}
        <SessionSummary
          known={session.known}
          unknown={session.unknown}
          total={session.total}
          deckId={deckId!}
          deckName={deckMeta?.name}
          onRestartAll={handleRestartAll}
          onRestartUnknown={handleRestartUnknown}
        />
      </div>
    );
  }

  // ── STATE: Studying ───────────────────────────────────────────────────
  const card = session.currentCard;
  if (!card) return null;

  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px)",
        background: "var(--cream, #f8f6f0)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          background: "white",
          borderBottom: "1.5px solid var(--border)",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <button
          onClick={() => {
            setStudyMode(null);
            setSrsSubmitted(false);
          }}
          style={{
            border: "none",
            background: "transparent",
            color: "var(--muted)",
            cursor: "pointer",
            fontFamily: "'Outfit', sans-serif",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontWeight: 500,
          }}
        >
          ← Thoát
        </button>

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: "'Fraunces', serif",
              fontWeight: 700,
              fontSize: 16,
              color: "var(--navy)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              justifyContent: "center",
            }}
          >
            {deckMeta?.name || "Phiên học"}
            {studyMode === "due" && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#e05252",
                  background: "rgba(255,107,107,.1)",
                  borderRadius: 6,
                  padding: "2px 7px",
                }}
              >
                Due only
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            {session.answered}/{session.total} đã trả lời
          </div>
        </div>

        {/* Auto-play toggle */}
        <button
          onClick={() => setAutoPlay((a) => !a)}
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

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px",
          gap: 40,
        }}
      >
        {/* Counter pills */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#00C896",
              background: "rgba(0,200,150,.1)",
              padding: "3px 10px",
              borderRadius: 20,
            }}
          >
            ✅ {session.known.length} biết
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#e05252",
              background: "rgba(255,107,107,.08)",
              padding: "3px 10px",
              borderRadius: 20,
            }}
          >
            ❌ {session.unknown.length} chưa biết
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--muted)",
              background: "var(--cream-2)",
              padding: "3px 10px",
              borderRadius: 20,
            }}
          >
            📇 {session.total - session.answered} còn lại
          </span>
        </div>

        {/* Flashcard */}
        <div
          className="animate-fade-up"
          style={{ width: "100%", maxWidth: 600 }}
        >
          <FlashcardFlip
            card={card}
            isFlipped={session.isFlipped}
            language={deckMeta?.language}
            onFlip={session.flipCard}
          />
        </div>

        {/* Manual TTS */}
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
