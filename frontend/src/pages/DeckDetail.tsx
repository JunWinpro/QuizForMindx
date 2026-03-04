import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";
import type { Card } from "../types/card";

export default function DeckDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [studyMode, setStudyMode] = useState(false);
  const [current, setCurrent] = useState(0);
  const [cardFlip, setCardFlip] = useState(false);
  const [known, setKnown] = useState(0);
  const [unknown, setUnknown] = useState(0);
  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);

api.get(`/decks/${id}/cards`)
  .then(res => {
    if (res.data.success) {
      setCards(res.data.data || []);
    } else {
      setCards([]);
    }
  })
      .catch((err) => {
        console.error(`Lỗi khi gọi /api/decks/${id}/cards`, err);
        // tùy xử lý: redirect về list nếu cần
        // navigate("/");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);
useEffect(() => {
  if (!id) return;

  setLoading(true);

  api.get(`/decks/${id}/cards`)
    .then((res) => {
      if (res?.data?.success) {
        setCards(res.data.data || []);
      } else {
        setCards([]);
      }
    })
    .catch((err) => {
      console.error("Fetch cards error:", err);
      setCards([]);
    })
    .finally(() => {
      setLoading(false);
    });

}, [id]);
  /* ── Study Mode ── */
  if (studyMode) {
    if (current >= cards.length) {
      return (
        <div
          style={{
            maxWidth: 600,
            margin: "80px auto",
            padding: "0 24px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
          <h2
            style={{
              fontFamily: "'Fraunces',serif",
              fontWeight: 700,
              fontSize: 32,
              color: "var(--navy)",
              marginBottom: 16,
            }}
          >
            Hoàn thành!
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 32,
            }}
          >
            <div
              style={{
                background: "rgba(0,200,150,.08)",
                border: "1.5px solid rgba(0,200,150,.2)",
                borderRadius: 16,
                padding: 20,
              }}
            >
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  color: "var(--emerald)",
                  fontFamily: "'Fraunces',serif",
                }}
              >
                {known}
              </div>
              <div
                style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}
              >
                Đã nhớ ✅
              </div>
            </div>
            <div
              style={{
                background: "rgba(255,107,107,.08)",
                border: "1.5px solid rgba(255,107,107,.2)",
                borderRadius: 16,
                padding: 20,
              }}
            >
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  color: "#FF6B6B",
                  fontFamily: "'Fraunces',serif",
                }}
              >
                {unknown}
              </div>
              <div
                style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}
              >
                Cần ôn thêm ❌
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => {
                setCurrent(0);
                setCardFlip(false);
                setKnown(0);
                setUnknown(0);
              }}
              style={{
                background: "var(--navy)",
                color: "white",
                padding: "12px 28px",
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 15,
                border: "none",
                cursor: "pointer",
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              Học lại 🔄
            </button>
            <button
              onClick={() => setStudyMode(false)}
              style={{
                background: "var(--cream-2)",
                color: "var(--navy)",
                padding: "12px 28px",
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 15,
                border: "none",
                cursor: "pointer",
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              Về danh sách
            </button>
          </div>
        </div>
      );
    }

    const card = cards[current];
    const progress = (current / cards.length) * 100;

    return (
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <button
            onClick={() => setStudyMode(false)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              color: "var(--muted)",
              fontFamily: "'Outfit',sans-serif",
              padding: 0,
            }}
          >
            ← Thoát
          </button>
          <span
            style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}
          >
            {current + 1} / {cards.length}
          </span>
        </div>
        <div
          style={{
            height: 4,
            background: "var(--cream-2)",
            borderRadius: 2,
            overflow: "hidden",
            marginBottom: 36,
          }}
        >
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div
          className="flip-card"
          style={{ marginBottom: 24 }}
          onClick={() => setCardFlip((f) => !f)}
        >
          <div
            className={`flip-card-inner${cardFlip ? " flipped" : ""}`}
            style={{ height: 300 }}
          >
            <div
              className="flip-card-front"
              style={{
                position: "absolute",
                inset: 0,
                background: "white",
                border: "1.5px solid var(--border)",
                borderRadius: 24,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "var(--shadow-lg)",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  marginBottom: 20,
                }}
              >
                Nhấn để lật ↩
              </div>
              <div
                style={{
                  fontFamily: "'Fraunces',serif",
                  fontSize: 44,
                  fontWeight: 700,
                  color: "var(--navy)",
                }}
              >
                {card.front}
              </div>
            </div>
            <div
              className="flip-card-back"
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(135deg,var(--navy),var(--navy-2))",
                borderRadius: 24,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 36,
                boxShadow: "var(--shadow-lg)",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  color: "var(--emerald)",
                  fontSize: 22,
                  fontWeight: 700,
                  textAlign: "center",
                  marginBottom: 12,
                }}
              >
                {card.back}
              </div>
            </div>
          </div>
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: 13,
            color: "var(--muted)",
            marginBottom: 20,
          }}
        >
          {cardFlip
            ? "Đánh giá mức độ ghi nhớ của bạn"
            : "Nhấn vào thẻ để xem đáp án"}
        </p>

        {cardFlip && (
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => {
                setUnknown((u) => u + 1);
                setCurrent((c) => c + 1);
                setCardFlip(false);
              }}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: 14,
                border: "2px solid #FF6B6B",
                background: "rgba(255,107,107,.08)",
                color: "#FF6B6B",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              ❌ Chưa nhớ
            </button>
            <button
              onClick={() => {
                setKnown((k) => k + 1);
                setCurrent((c) => c + 1);
                setCardFlip(false);
              }}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: 14,
                border: "2px solid var(--emerald)",
                background: "rgba(0,200,150,.08)",
                color: "var(--emerald-d)",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              ✅ Đã nhớ
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ── Card grid view ── */
  if (loading)
    return (
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
            gap: 20,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ borderRadius: 18, height: 180 }}
            />
          ))}
        </div>
      </div>
    );

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
      <div className="animate-fade-up" style={{ marginBottom: 32 }}>
        <button
          onClick={() => navigate("/decks")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            color: "var(--muted)",
            fontFamily: "'Outfit',sans-serif",
            padding: 0,
            marginBottom: 16,
          }}
        >
          ← Quay lại
        </button>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "'Fraunces',serif",
                fontWeight: 700,
                fontSize: "clamp(22px,4vw,34px)",
                color: "var(--navy)",
                marginBottom: 8,
              }}
            >
              Danh sách Flashcards
            </h1>
            <p style={{ color: "var(--muted)", fontSize: 15 }}>
              📇 {cards.length} thẻ · Nhấn vào thẻ để lật
            </p>
          </div>
          <button
            onClick={() => setStudyMode(true)}
            style={{
              background: "var(--emerald)",
              color: "var(--navy)",
              padding: "13px 28px",
              borderRadius: 14,
              fontWeight: 700,
              fontSize: 15,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 8px 24px rgba(0,200,150,.25)",
              fontFamily: "'Outfit',sans-serif",
              whiteSpace: "nowrap",
            }}
          >
            🎯 Bắt đầu luyện tập
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
          gap: 20,
        }}
      >
        {cards.map((card, i) => (
          <div
            key={card._id}
            className={`animate-fade-up stagger-${Math.min(i + 1, 6)}`}
            onClick={() =>
              setFlipped((f) => ({ ...f, [card._id]: !f[card._id] }))
            }
            style={{ cursor: "pointer" }}
          >
            <div className="flip-card">
              <div
                className={`flip-card-inner${flipped[card._id] ? " flipped" : ""}`}
                style={{ height: 180 }}
              >
                <div
                  className="flip-card-front"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "white",
                    border: "1.5px solid var(--border)",
                    borderRadius: 18,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 24,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Fraunces',serif",
                      fontSize: 26,
                      fontWeight: 700,
                      color: "var(--navy)",
                      textAlign: "center",
                      marginBottom: 10,
                    }}
                  >
                    {card.front}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--muted)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    NHẤN ĐỂ LẬT ↩
                  </div>
                </div>
                <div
                  className="flip-card-back"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(135deg,var(--navy),var(--navy-2))",
                    borderRadius: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 20,
                  }}
                >
                  <p
                    style={{
                      color: "rgba(255,255,255,.9)",
                      fontSize: 15,
                      textAlign: "center",
                      lineHeight: 1.6,
                    }}
                  >
                    {card.back}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
