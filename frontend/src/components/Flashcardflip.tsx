import type { StudyCard } from "../hooks/Usestudysession";

interface FlashcardFlipProps {
  card: StudyCard;
  isFlipped: boolean;
  language?: string;
  onFlip: () => void;
}

const LANG_LABEL: Record<string, string> = {
  en: "English", ja: "日本語", fr: "Français",
  zh: "中文", de: "Deutsch", ko: "한국어",
};
const FLAG: Record<string, string> = {
  en: "🇬🇧", ja: "🇯🇵", fr: "🇫🇷", zh: "🇨🇳", de: "🇩🇪", ko: "🇰🇷",
};

export default function FlashcardFlip({ card, isFlipped, language = "en", onFlip }: FlashcardFlipProps) {
  return (
    <div
      onClick={onFlip}
      style={{
        width: "100%",
        maxWidth: 560,
        height: 320,
        perspective: 1200,
        cursor: "pointer",
        userSelect: "none",
        WebkitUserSelect: "none",
        margin: "0 auto",
      }}
      role="button"
      aria-label={isFlipped ? "Ẩn đáp án" : "Xem đáp án"}
      tabIndex={0}
      onKeyDown={e => e.key === " " || e.key === "Enter" ? onFlip() : undefined}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          transition: "transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* ── FRONT ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            background: "white",
            borderRadius: 28,
            border: "2px solid var(--border)",
            boxShadow: "0 20px 60px rgba(13,27,42,.10), 0 4px 16px rgba(13,27,42,.06)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 36px",
            gap: 12,
          }}
        >
          {/* language badge */}
          <div style={{
            position: "absolute", top: 20, left: 24,
            fontSize: 12, fontWeight: 700, color: "var(--muted)",
            letterSpacing: "0.06em", textTransform: "uppercase",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span>{FLAG[language] || "🌐"}</span>
            <span>{LANG_LABEL[language] || language.toUpperCase()}</span>
          </div>

          {/* hint */}
          <div style={{
            position: "absolute", bottom: 20, right: 24,
            fontSize: 12, color: "var(--muted)", fontStyle: "italic",
          }}>
            Nhấp để xem đáp án
          </div>

          {/* main word */}
          <div style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "clamp(28px, 5vw, 44px)",
            fontWeight: 700,
            color: "var(--navy)",
            textAlign: "center",
            lineHeight: 1.2,
          }}>
            {card.front}
          </div>

          {/* phonetic */}
          {card.phonetic && (
            <div style={{
              fontSize: 15,
              color: "var(--muted)",
              fontStyle: "italic",
              letterSpacing: "0.02em",
            }}>
              {card.phonetic}
            </div>
          )}

          {/* decorative dot */}
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "var(--emerald)",
            opacity: 0.6,
            marginTop: 8,
          }} />
        </div>

        {/* ── BACK ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            // background: "linear-gradient(145deg, var(--navy), var(--navy-2, #0d2137))",
            background:"#1e293b",
            borderRadius: 28,
            boxShadow: "0 20px 60px rgba(13,27,42,.20), 0 4px 16px rgba(13,27,42,.10)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 36px",
            gap: 16,
          }}
        >
          {/* front word (mini) */}
          <div style={{
            position: "absolute", top: 20, left: 24,
            fontFamily: "'Fraunces', serif",
            fontSize: 13, fontWeight: 600,
            color: "rgba(255,255,255,.4)",
          }}>
            {card.front}
          </div>

          {/* meaning */}
          <div style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "clamp(22px, 4vw, 34px)",
            fontWeight: 800,
            color: "#fbbf24  !important" ,
            textAlign: "center",
            lineHeight: 1.3,
          }}>
            {card.back}
          </div>

          {/* example */}
          {card.example && (
            <div style={{
              fontSize: 13,
              color: "rgba(255,255,255,.6)",
              textAlign: "center",
              fontStyle: "italic",
              lineHeight: 1.6,
              maxWidth: 380,
              background: "rgba(255,255,255,.06)",
              borderRadius: 12,
              padding: "10px 16px",
              borderLeft: "3px solid var(--emerald)",
            }}>
              "{card.example}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}