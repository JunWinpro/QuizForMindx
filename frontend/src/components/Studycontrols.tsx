import { useEffect } from "react";

interface StudyControlsProps {
  isFlipped: boolean;
  currentIndex: number;
  total: number;
  progress: number;
  onFlip: () => void;
  onKnown: () => void;
  onUnknown: () => void;
  onSkip: () => void;
}

export default function StudyControls({
  isFlipped,
  currentIndex,
  total,
  progress,
  onFlip,
  onKnown,
  onUnknown,
  onSkip,
}: StudyControlsProps) {

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === " " || e.key === "ArrowUp") { e.preventDefault(); onFlip(); }
      if (isFlipped) {
        if (e.key === "1" || e.key === "ArrowRight") onKnown();
        if (e.key === "2" || e.key === "ArrowLeft")  onUnknown();
        if (e.key === "s" || e.key === "S")           onSkip();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFlipped, onFlip, onKnown, onUnknown, onSkip]);

  const current = Math.min(currentIndex + 1, total);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, width: "100%" }}>

      {/* Progress bar */}
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>
            Thẻ {current} / {total}
          </span>
          <span style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 700 }}>
            {progress}%
          </span>
        </div>
        <div style={{
          height: 6,
          background: "var(--cream-2)",
          borderRadius: 3,
          overflow: "hidden",
        }}>
          <div
            className="progress-fill"
            style={{
              width: `${progress}%`,
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      {/* Flip hint (before flip) or Action buttons (after flip) */}
      {!isFlipped ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <button
            onClick={onFlip}
            style={{
              background: "var(--navy)",
              color: "white",
              border: "none",
              borderRadius: 16,
              padding: "14px 48px",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
              boxShadow: "0 8px 24px rgba(13,27,42,.18)",
              transition: "transform .15s, box-shadow .15s",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 28px rgba(13,27,42,.22)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(13,27,42,.18)"; }}
          >
            👁 Xem đáp án
          </button>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <kbd style={kbdStyle}>Space</kbd>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>để lật thẻ</span>
            <button onClick={onSkip} style={skipBtnStyle}>Bỏ qua →</button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", gap: 16 }}>
            {/* Unknown */}
            <button
              onClick={onUnknown}
              style={{
                ...actionBtn,
                background: "rgba(255,107,107,.08)",
                border: "2px solid rgba(255,107,107,.35)",
                color: "#e05252",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,107,107,.15)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,107,107,.08)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
            >
              <span style={{ fontSize: 20 }}>❌</span>
              <span>Chưa biết</span>
            </button>

            {/* Known */}
            <button
              onClick={onKnown}
              style={{
                ...actionBtn,
                background: "rgba(0,200,150,.08)",
                border: "2px solid rgba(0,200,150,.35)",
                color: "var(--emerald)",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,200,150,.15)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,200,150,.08)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
            >
              <span style={{ fontSize: 20 }}>✅</span>
              <span>Đã biết</span>
            </button>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Phím tắt:</span>
            <kbd style={kbdStyle}>2</kbd>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Chưa biết</span>
            <kbd style={kbdStyle}>1</kbd>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Đã biết</span>
            <button onClick={onSkip} style={skipBtnStyle}>Bỏ qua</button>
          </div>
        </div>
      )}
    </div>
  );
}

const actionBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "14px 32px",
  borderRadius: 16,
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "'Outfit', sans-serif",
  transition: "transform .15s, background .15s",
};

const kbdStyle: React.CSSProperties = {
  background: "var(--cream-2)",
  border: "1.5px solid var(--border)",
  borderRadius: 6,
  padding: "2px 8px",
  fontSize: 11,
  fontWeight: 700,
  color: "var(--muted)",
  fontFamily: "monospace",
};

const skipBtnStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "var(--muted)",
  fontSize: 12,
  cursor: "pointer",
  fontFamily: "'Outfit', sans-serif",
  fontWeight: 500,
  textDecoration: "underline",
  padding: "2px 4px",
};