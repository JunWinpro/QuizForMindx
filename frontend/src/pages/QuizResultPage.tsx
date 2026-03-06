import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

interface WrongCard {
  cardId: string;
  front: string;
  back: string;
  selectedAnswer: string;
  correctAnswer: string;
}

interface QuizResultData {
  _id: string;
  deckId: string;
  deckName: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  duration: number;
  wrongCards: WrongCard[];
  createdAt: string;
}

// Canvas confetti (reuse pattern from SessionSummary)
function useConfetti(trigger: boolean) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!trigger) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#00C896", "#F5A623", "#0D1B2A", "#45B7D1", "#FF6B6B", "#FFD700", "#C8A2C8"];
    const pieces = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 300,
      vx: (Math.random() - 0.5) * 5,
      vy: 2.5 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 5 + Math.random() * 9,
      rotation: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 7,
    }));

    let rafId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of pieces) {
        p.x += p.vx; p.y += p.vy; p.rotation += p.rotV;
        if (p.y < canvas.height + 20) alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      if (alive) rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [trigger]);
  return canvasRef;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function QuizResultPage() {
  const { resultId } = useParams<{ resultId: string }>();
  const navigate = useNavigate();

  const [result, setResult]   = useState<QuizResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [showWrong, setShowWrong] = useState(false);

  useEffect(() => {
    if (!resultId) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/quiz/history/${resultId}`);
        if (res.data?.success) {
          setResult(res.data.data);
        } else {
          setError("Không tìm thấy kết quả");
        }
      } catch (err: any) {
        setError(err?.response?.data?.message ?? "Lỗi kết nối");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [resultId]);

  const isGreat   = (result?.score ?? 0) >= 80;
  const isPerfect = (result?.score ?? 0) === 100;
  const confettiRef = useConfetti(isGreat && !loading);

  if (loading) {
    return (
      <div style={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: "4px solid var(--cream-2)",
          borderTopColor: "var(--emerald)",
          borderRadius: "50%",
          animation: "spin .8s linear infinite",
        }} />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div style={{
        maxWidth: 480,
        margin: "60px auto",
        padding: 24,
        textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: "var(--navy)", marginBottom: 8 }}>
          Không tìm thấy kết quả
        </div>
        <div style={{ color: "var(--muted)", marginBottom: 24 }}>{error}</div>
        <Link to="/quiz" style={{ color: "var(--emerald-d)", fontWeight: 600 }}>← Về trang Quiz</Link>
      </div>
    );
  }

  const score        = result.score;
  const emoji        = isPerfect ? "🏆" : isGreat ? "🎉" : score >= 50 ? "💪" : "📚";
  const message      = isPerfect ? "Hoàn hảo!" : isGreat ? "Làm tốt lắm!" : score >= 50 ? "Tiếp tục cố gắng!" : "Hãy ôn thêm nhé!";
  const wrongCount   = result.totalQuestions - result.correctCount;
  const accuracy     = score;

  return (
    <div style={{
      maxWidth: 600,
      margin: "0 auto",
      padding: "48px 24px 80px",
      position: "relative",
    }}>
      {/* Confetti */}
      {isGreat && (
        <canvas
          ref={confettiRef}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            pointerEvents: "none",
            width: "100%",
            height: "100%",
          }}
        />
      )}

      {/* ── Hero section ── */}
      <div className="animate-fade-up" style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 72, marginBottom: 16, lineHeight: 1 }}>{emoji}</div>
        <h1 style={{
          fontFamily: "'Fraunces', serif",
          fontWeight: 700,
          fontSize: "clamp(28px, 5vw, 40px)",
          color: "var(--navy)",
          marginBottom: 8,
          letterSpacing: "-0.5px",
        }}>
          {message}
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 15 }}>
          {result.deckName}
        </p>
      </div>

      {/* ── Score ring ── */}
      <div className="animate-fade-up stagger-1" style={{
        display: "flex",
        justifyContent: "center",
        marginBottom: 36,
      }}>
        <div style={{
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: `conic-gradient(
            ${isGreat ? "#00C896" : score >= 50 ? "#F5A623" : "#FF6B6B"} ${accuracy * 3.6}deg,
            var(--cream-2) 0deg
          )`,
          boxShadow: isGreat
            ? "0 0 0 10px rgba(0,200,150,.1), 0 20px 60px rgba(0,200,150,.2)"
            : "0 0 0 10px rgba(245,166,35,.1), 0 20px 60px rgba(245,166,35,.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}>
          {/* Inner white circle */}
          <div style={{
            width: 128,
            height: 128,
            borderRadius: "50%",
            background: "white",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(0,0,0,.05)",
          }}>
            <span style={{
              fontFamily: "'Fraunces', serif",
              fontWeight: 700,
              fontSize: 40,
              color: "var(--navy)",
              lineHeight: 1,
              letterSpacing: "-2px",
            }}>
              {score}%
            </span>
            <span style={{
              fontSize: 11,
              color: "var(--muted)",
              fontWeight: 600,
              marginTop: 2,
              letterSpacing: "0.04em",
            }}>
              CHÍNH XÁC
            </span>
          </div>
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div className="animate-fade-up stagger-2" style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 12,
        marginBottom: 28,
      }}>
        {[
          {
            icon: "✅",
            value: result.correctCount,
            label: "Câu đúng",
            color: "#00C896",
            bg: "rgba(0,200,150,.06)",
            border: "rgba(0,200,150,.2)",
          },
          {
            icon: "❌",
            value: wrongCount,
            label: "Câu sai",
            color: "#FF6B6B",
            bg: "rgba(255,107,107,.06)",
            border: "rgba(255,107,107,.2)",
          },
          {
            icon: "⏱",
            value: formatDuration(result.duration),
            label: "Thời gian",
            color: "#F5A623",
            bg: "rgba(245,166,35,.06)",
            border: "rgba(245,166,35,.2)",
          },
        ].map(stat => (
          <div key={stat.label} style={{
            background: stat.bg,
            border: `1.5px solid ${stat.border}`,
            borderRadius: 18,
            padding: "20px 12px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{stat.icon}</div>
            <div style={{
              fontFamily: "'Fraunces', serif",
              fontWeight: 700,
              fontSize: typeof stat.value === "number" ? 30 : 22,
              color: stat.color,
              lineHeight: 1,
              marginBottom: 6,
            }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, letterSpacing: "0.04em" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Wrong cards section ── */}
      {wrongCount > 0 && (
        <div className="animate-fade-up stagger-3" style={{ marginBottom: 32 }}>
          {/* Accordion header */}
          <button
            onClick={() => setShowWrong(v => !v)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 18px",
              background: "rgba(255,107,107,.06)",
              border: "1.5px solid rgba(255,107,107,.2)",
              borderRadius: showWrong ? "14px 14px 0 0" : 14,
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
              transition: "border-radius .2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>❌</span>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#c0392b" }}>
                Xem lại {wrongCount} câu sai
              </span>
            </div>
            <span style={{
              fontSize: 14,
              color: "#c0392b",
              transform: showWrong ? "rotate(180deg)" : "rotate(0)",
              transition: "transform .2s",
              display: "inline-block",
            }}>▾</span>
          </button>

          {/* Wrong cards list */}
          {showWrong && (
            <div style={{
              border: "1.5px solid rgba(255,107,107,.2)",
              borderTop: "none",
              borderRadius: "0 0 14px 14px",
              overflow: "hidden",
              animation: "fadeIn .2s ease",
            }}>
              {result.wrongCards.map((card, i) => (
                <div key={card.cardId + i} style={{
                  padding: "14px 18px",
                  borderTop: i > 0 ? "1px solid rgba(255,107,107,.1)" : "none",
                  display: "grid",
                  gridTemplateColumns: "1fr auto 1fr",
                  alignItems: "center",
                  gap: 12,
                  background: i % 2 === 0 ? "white" : "rgba(255,107,107,.02)",
                }}>
                  {/* Question */}
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 3, fontWeight: 600, letterSpacing: "0.04em" }}>
                      TỪ
                    </div>
                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, color: "var(--navy)" }}>
                      {card.front}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div style={{ color: "var(--muted)", fontSize: 16 }}>→</div>

                  {/* Answers */}
                  <div>
                    <div style={{ fontSize: 11, color: "#c0392b", marginBottom: 2, fontWeight: 600 }}>
                      ❌ {card.selectedAnswer}
                    </div>
                    <div style={{ fontSize: 11, color: "#00a87f", fontWeight: 600 }}>
                      ✅ {card.correctAnswer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="animate-fade-up stagger-4" style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}>
        {/* Retry same quiz */}
        <button
          onClick={() => {
            const params = new URLSearchParams({ count: String(result.totalQuestions), timer: "0" });
            navigate(`/quiz/play/${result.deckId}?${params.toString()}`);
          }}
          style={{
            background: "var(--navy)",
            color: "white",
            border: "none",
            borderRadius: 14,
            padding: "14px 28px",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Outfit', sans-serif",
            boxShadow: "0 8px 24px rgba(13,27,42,.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "transform .15s",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"}
        >
          🔁 Làm lại bài này
        </button>

        <div style={{ display: "flex", gap: 12 }}>
          <Link
            to="/quiz"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              background: "white",
              border: "1.5px solid var(--border)",
              color: "var(--navy)",
              borderRadius: 14,
              padding: "12px 20px",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              fontFamily: "'Outfit', sans-serif",
              transition: "all .15s",
            }}
          >
            🎯 Quiz mới
          </Link>
          <Link
            to="/quiz/history"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              background: "transparent",
              border: "1.5px solid var(--border)",
              color: "var(--muted)",
              borderRadius: 14,
              padding: "12px 20px",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            📋 Lịch sử
          </Link>
        </div>

        {/* Study weak words */}
        {wrongCount > 0 && (
          <Link
            to={`/study/${result.deckId}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              background: "rgba(0,200,150,.08)",
              border: "1.5px solid rgba(0,200,150,.25)",
              color: "var(--emerald-d)",
              borderRadius: 14,
              padding: "12px 20px",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            📖 Ôn lại bộ này với Flashcard
          </Link>
        )}
      </div>
    </div>
  );
}