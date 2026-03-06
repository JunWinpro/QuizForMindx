import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const FLAG: Record<string, string> = {
  en: "🇬🇧", ja: "🇯🇵", fr: "🇫🇷",
  zh: "🇨🇳", de: "🇩🇪", ko: "🇰🇷", vi: "🇻🇳",
};

interface Progress {
  totalCards: number;
  learnedCards: number;
  masteredCards: number;
  learnedPercent: number;
  masteredPercent: number;
}

interface SavedDeckItem {
  savedAt: string;
  isOwner: boolean;
  deck: {
    _id: string;
    name: string;
    description?: string;
    language: string;
    frontLanguage: string;
    backLanguage: string;
    isPublic: boolean;
    cardCount: number;
    ownerName: string;
    ownerId: string;
  };
  progress: Progress;
}

function ProgressBar({
  learnedPct,
  masteredPct,
}: {
  learnedPct: number;
  masteredPct: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600, color: "var(--muted)" }}>
        <span>Đã học</span>
        <span style={{ color: "var(--emerald)" }}>{learnedPct}%</span>
      </div>
      <div style={{ height: 6, background: "var(--cream-2)", borderRadius: 3, overflow: "hidden" }}>
        {/* Mastered (đậm) + Learned (nhạt) */}
        <div style={{ position: "relative", height: "100%", width: `${learnedPct}%`, background: "rgba(0,200,150,.3)", borderRadius: 3, transition: "width .6s ease" }}>
          <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${learnedPct > 0 ? Math.round((masteredPct / learnedPct) * 100) : 0}%`, background: "var(--emerald)", borderRadius: 3, transition: "width .6s ease" }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--muted)" }}>
        <span>🟢 Thuộc vững: <b style={{ color: "var(--emerald)" }}>{masteredPct}%</b></span>
        <span>🔵 Đang học: <b>{learnedPct - masteredPct > 0 ? learnedPct - masteredPct : 0}%</b></span>
      </div>
    </div>
  );
}

export default function SavedDecksPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<SavedDeckItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unsaving, setUnsaving] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "owned" | "saved">("all");

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    api.get("/saved-decks")
      .then(res => { if (res.data?.success) setItems(res.data.data ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleUnsave = async (deckId: string) => {
    setUnsaving(deckId);
    try {
      await api.delete(`/saved-decks/${deckId}`);
      setItems(prev => prev.filter(i => i.deck._id !== deckId));
    } catch {}
    finally { setUnsaving(null); }
  };

  const filtered = items.filter(item => {
    if (filter === "owned") return item.isOwner;
    if (filter === "saved") return !item.isOwner;
    return true;
  });

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}>
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "clamp(24px,4vw,36px)", color: "var(--navy)", marginBottom: 8 }}>
          📚 Deck đã lưu
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 15 }}>
          {items.length} bộ flashcard · Theo dõi tiến trình học của bạn
        </p>
      </div>

      {/* Filter tabs */}
      <div className="animate-fade-up stagger-1" style={{ display: "flex", gap: 6, marginBottom: 28, background: "white", border: "1.5px solid var(--border)", borderRadius: 14, padding: 5, width: "fit-content" }}>
        {([
          { id: "all",   label: "Tất cả" },
          { id: "owned", label: "Của tôi" },
          { id: "saved", label: "Đã lưu" },
        ] as const).map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{ padding: "9px 20px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 13, background: filter === f.id ? "var(--navy)" : "transparent", color: filter === f.id ? "white" : "var(--muted)", transition: "all .2s" }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 24 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ borderRadius: 20, height: 260 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 24px", background: "white", border: "1.5px solid var(--border)", borderRadius: 20 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>📭</div>
          <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 20, color: "var(--navy)", marginBottom: 8 }}>
            {filter === "all" ? "Chưa lưu deck nào" : "Không có deck nào"}
          </div>
          <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>
            Khám phá và lưu các bộ flashcard để theo dõi tiến trình
          </div>
          <Link to="/decks" style={{ background: "var(--navy)", color: "white", padding: "11px 28px", borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: "none", display: "inline-block" }}>
            🔍 Khám phá flashcard
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 24 }}>
          {filtered.map((item, i) => {
            const { deck, progress } = item;
            return (
              <div key={deck._id} className={`animate-fade-up stagger-${Math.min(i + 1, 6)}`}>
                <div className="deck-card" style={{ position: "relative", display: "flex", flexDirection: "column", gap: 0 }}>
                  {/* Owner badge */}
                  <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 6 }}>
                    {item.isOwner && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "rgba(13,27,42,.08)", color: "var(--navy)" }}>
                        ✏️ Của tôi
                      </span>
                    )}
                  </div>

                  {/* Language icon */}
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--cream-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 14 }}>
                    {FLAG[deck.language] || "🌐"}
                  </div>

                  <h3 style={{ fontWeight: 700, fontSize: 16, color: "var(--navy)", marginBottom: 6, lineHeight: 1.3, paddingRight: 80 }}>
                    {deck.name}
                  </h3>
                  {deck.description && (
                    <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5, marginBottom: 12, minHeight: 36 }}>
                      {deck.description}
                    </p>
                  )}

                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16, display: "flex", gap: 10 }}>
                    <span>📇 {deck.cardCount} thẻ</span>
                    {deck.frontLanguage && deck.backLanguage && (
                      <span>{FLAG[deck.frontLanguage]} → {FLAG[deck.backLanguage]}</span>
                    )}
                    {!item.isOwner && <span>👤 {deck.ownerName}</span>}
                  </div>

                  {/* Progress bar */}
                  <div style={{ marginBottom: 20 }}>
                    <ProgressBar learnedPct={progress.learnedPercent} masteredPct={progress.masteredPercent} />
                  </div>

                  {/* Status breakdown */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                    {[
                      { label: "Mới", value: progress.totalCards - progress.learnedCards, color: "var(--muted)", bg: "var(--cream-2)" },
                      { label: "Đang học", value: progress.learnedCards - progress.masteredCards, color: "#D4890A", bg: "rgba(245,166,35,.1)" },
                      { label: "Thuộc", value: progress.masteredCards, color: "var(--emerald)", bg: "rgba(0,200,150,.1)" },
                    ].map(s => (
                      <div key={s.label} style={{ flex: 1, textAlign: "center", background: s.bg, borderRadius: 10, padding: "6px 4px" }}>
                        <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 16, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 600 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                    <Link to={`/study/${deck._id}`}
                      style={{ flex: 1, textAlign: "center", padding: "10px", background: "var(--emerald)", color: "var(--navy)", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                      🚀 Học
                    </Link>
                    <Link to={`/decks/${deck._id}`}
                      style={{ flex: 1, textAlign: "center", padding: "10px", background: "var(--navy)", color: "white", borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                      📖 Xem
                    </Link>

                    {!item.isOwner && (
                      <button onClick={() => handleUnsave(deck._id)} disabled={unsaving === deck._id}
                        title="Bỏ lưu"
                        style={{ padding: "10px 12px", background: "rgba(255,107,107,.08)", color: "#FF6B6B", border: "1.5px solid rgba(255,107,107,.2)", borderRadius: 10, fontSize: 13, cursor: "pointer" }}>
                        {unsaving === deck._id ? "..." : "🗑️"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}