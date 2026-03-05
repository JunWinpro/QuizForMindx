import { useEffect, useRef } from "react";
import type { StudyCard } from "../hooks/Usestudysession";
import { Link } from "react-router-dom";

interface SessionSummaryProps {
  known: StudyCard[];
  unknown: StudyCard[];
  total: number;
  deckId: string;
  deckName?: string;
  onRestartAll: () => void;
  onRestartUnknown: () => void;
}

// Simple canvas confetti
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

    const pieces: {
      x: number; y: number; vx: number; vy: number;
      color: string; size: number; rotation: number; rotV: number;
    }[] = [];

    const colors = ["#00C896", "#F5A623", "#0D1B2A", "#45B7D1", "#FF6B6B", "#FFD700"];
    for (let i = 0; i < 120; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: -10 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 8,
        rotation: Math.random() * 360,
        rotV: (Math.random() - 0.5) * 6,
      });
    }

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

export default function SessionSummary({
  known, unknown, total, deckId, deckName,
  onRestartAll, onRestartUnknown,
}: SessionSummaryProps) {
  const knownCount = known.length;
  const unknownCount = unknown.length;
  const skipped = total - knownCount - unknownCount;
  const accuracy = total > 0 ? Math.round((knownCount / total) * 100) : 0;
  const isGreat = accuracy >= 80;
  const confettiRef = useConfetti(isGreat);

  const statItems = [
    { icon: "✅", label: "Đã biết",   value: knownCount,   color: "#00C896" },
    { icon: "❌", label: "Chưa biết", value: unknownCount, color: "#FF6B6B" },
    { icon: "⏭",  label: "Bỏ qua",   value: skipped,      color: "var(--muted)" },
  ];

  return (
    <div style={{ position: "relative", maxWidth: 520, margin: "0 auto", padding: "40px 24px", textAlign: "center" }}>
      {/* Confetti canvas */}
      {isGreat && (
        <canvas
          ref={confettiRef}
          style={{
            position: "fixed", inset: 0, zIndex: 999,
            pointerEvents: "none", width: "100%", height: "100%",
          }}
        />
      )}

      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>
          {accuracy === 100 ? "🏆" : isGreat ? "🎉" : accuracy >= 50 ? "💪" : "📚"}
        </div>
        <h2 style={{
          fontFamily: "'Fraunces', serif",
          fontWeight: 700,
          fontSize: "clamp(24px, 4vw, 36px)",
          color: "var(--navy)",
          marginBottom: 8,
        }}>
          {accuracy === 100 ? "Xuất sắc!" : isGreat ? "Làm tốt lắm!" : accuracy >= 50 ? "Tiếp tục cố gắng!" : "Hãy ôn thêm nhé!"}
        </h2>
        <p style={{ color: "var(--muted)", fontSize: 15 }}>
          {deckName ? `Phiên học: ${deckName}` : "Kết thúc phiên học"}
        </p>
      </div>

      {/* Accuracy ring */}
      <div className="animate-fade-up stagger-1" style={{ marginBottom: 32 }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: `conic-gradient(
            ${isGreat ? "var(--emerald)" : "#F5A623"} ${accuracy * 3.6}deg,
            var(--cream-2) 0deg
          )`,
          boxShadow: isGreat
            ? "0 0 0 8px rgba(0,200,150,.12)"
            : "0 0 0 8px rgba(245,166,35,.12)",
        }}>
          <div style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}>
            <span style={{
              fontFamily: "'Fraunces', serif",
              fontWeight: 700,
              fontSize: 26,
              color: "var(--navy)",
              lineHeight: 1,
            }}>
              {accuracy}%
            </span>
            <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>chính xác</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="animate-fade-up stagger-2" style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 12,
        marginBottom: 32,
      }}>
        {statItems.map(s => (
          <div key={s.label} style={{
            background: "white",
            border: "1.5px solid var(--border)",
            borderRadius: 16,
            padding: "16px 8px",
          }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
            <div style={{
              fontFamily: "'Fraunces', serif",
              fontWeight: 700,
              fontSize: 24,
              color: s.color,
              lineHeight: 1,
              marginBottom: 4,
            }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Unknown cards list */}
      {unknown.length > 0 && (
        <div className="animate-fade-up stagger-3" style={{
          background: "rgba(255,107,107,.04)",
          border: "1.5px solid rgba(255,107,107,.2)",
          borderRadius: 16,
          padding: "16px 20px",
          marginBottom: 28,
          textAlign: "left",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#e05252", marginBottom: 10 }}>
            ❌ Từ chưa thuộc ({unknown.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 160, overflowY: "auto" }}>
            {unknown.map(c => (
              <div key={c._id} style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                padding: "4px 0",
                borderBottom: "1px solid rgba(255,107,107,.1)",
              }}>
                <span style={{ fontWeight: 600, color: "var(--navy)" }}>{c.front}</span>
                <span style={{ color: "var(--muted)" }}>{c.back}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="animate-fade-up stagger-4" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {unknown.length > 0 && (
          <button
            onClick={onRestartUnknown}
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
            }}
          >
            🔁 Học lại {unknown.length} từ chưa biết
          </button>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onRestartAll}
            style={{
              flex: 1,
              background: "var(--cream-2)",
              color: "var(--navy)",
              border: "1.5px solid var(--border)",
              borderRadius: 14,
              padding: "12px 20px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            ↩ Học lại tất cả
          </button>

          <Link
            to={`/decks/${deckId}`}
            style={{
              flex: 1,
              background: "transparent",
              color: "var(--muted)",
              border: "1.5px solid var(--border)",
              borderRadius: 14,
              padding: "12px 20px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Kết thúc
          </Link>
        </div>
      </div>
    </div>
  );
}