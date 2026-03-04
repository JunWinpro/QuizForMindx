import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import type { Card } from "../types/card";

interface DeckInfo {
  _id: string;
  name: string;
  description?: string;
  language: string;
  isPublic: boolean;
  cardCount: number;
  ownerId: string;
  ownerName?: string;
}
interface CardForm {
  front: string;
  back: string;
  example: string;
}
const emptyCardForm: CardForm = { front: "", back: "", example: "" };
const FLAG: Record<string, string> = {
  en: "🇬🇧",
  ja: "🇯🇵",
  fr: "🇫🇷",
  zh: "🇨🇳",
  de: "🇩🇪",
  ko: "🇰🇷",
};

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: 24,
          padding: "32px 36px",
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 24px 60px rgba(0,0,0,.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              fontFamily: "'Fraunces',serif",
              fontWeight: 700,
              fontSize: 22,
              color: "var(--navy)",
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "var(--cream-2)",
              border: "none",
              width: 32,
              height: 32,
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 9999,
        background: type === "success" ? "#00c896" : "#FF6B6B",
        color: type === "success" ? "var(--navy)" : "white",
        padding: "14px 20px",
        borderRadius: 12,
        fontWeight: 600,
        fontSize: 14,
        boxShadow: "0 4px 20px rgba(0,0,0,.25)",
        maxWidth: 320,
      }}
    >
      {msg}
    </div>
  );
}

export default function DeckDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [deck, setDeck] = useState<DeckInfo | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [studyMode, setStudyMode] = useState(false);
  const [current, setCurrent] = useState(0);
  const [cardFlip, setCardFlip] = useState(false);
  const [known, setKnown] = useState(0);
  const [unknown, setUnknown] = useState(0);

  // Card management
  const [tab, setTab] = useState<"cards" | "manage">("cards");
  const [showAddCard, setShowAddCard] = useState(false);
  const [editCard, setEditCard] = useState<Card | null>(null);
  const [deleteCard, setDeleteCard] = useState<Card | null>(null);
  const [cardForm, setCardForm] = useState<CardForm>(emptyCardForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isOwner = !!(user && deck && user._id === deck.ownerId);

  // --- Thêm TTS (client-side SpeechSynthesis) ---
  const langMap: Record<string, string> = {
    en: "en-US",
    ja: "ja-JP",
    fr: "fr-FR",
    zh: "zh-CN",
    de: "de-DE",
    ko: "ko-KR",
  };

  const playAudio = (text: string, forceLang?: string) => {
    try {
      if (!("speechSynthesis" in window)) {
        showToast("Trình duyệt không hỗ trợ TTS", "error");
        return;
      }
      const utter = new SpeechSynthesisUtterance(text);
      // ưu tiên ngôn ngữ của deck nếu có mapping
      const bcp = forceLang || (deck && langMap[deck.language]) || "en-US";
      utter.lang = bcp;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch (e) {
      // defensive
      showToast("Không thể phát âm thanh", "error");
    }
  };

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);
    Promise.all([api.get(`/decks/${id}`).catch(() => null), api.get(`/decks/${id}/cards`).catch(() => null)])
      .then(([deckRes, cardsRes]) => {
        if (!mounted) return;
        if (deckRes?.data?.success) setDeck(deckRes.data.data);
        if (cardsRes?.data?.success) setCards(cardsRes.data.data || []);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  // Card CRUD handlers
  const handleAddCard = async () => {
    if (!cardForm.front.trim() || !cardForm.back.trim()) return;
    setSaving(true);
    try {
      const res = await api.post(`/decks/${id}/cards`, cardForm);
      if (res.data?.success) {
        setCards((prev) => [...prev, res.data.data]);
        if (deck) setDeck({ ...deck, cardCount: deck.cardCount + 1 });
        setCardForm(emptyCardForm);
        setShowAddCard(false);
        showToast("Thêm thẻ thành công! ✅");
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Thêm thất bại", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCard = async () => {
    if (!editCard || !cardForm.front.trim() || !cardForm.back.trim()) return;
    setSaving(true);
    try {
      const res = await api.put(`/decks/${id}/cards/${editCard._id}`, cardForm);
      if (res.data?.success) {
        setCards((prev) => prev.map((c) => (c._id === editCard._id ? res.data.data : c)));
        setEditCard(null);
        setCardForm(emptyCardForm);
        showToast("Cập nhật thẻ thành công! ✅");
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Cập nhật thất bại", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!deleteCard) return;
    setDeleting(true);
    try {
      await api.delete(`/decks/${id}/cards/${deleteCard._id}`);
      setCards((prev) => prev.filter((c) => c._id !== deleteCard._id));
      if (deck) setDeck({ ...deck, cardCount: Math.max(0, deck.cardCount - 1) });
      setDeleteCard(null);
      showToast("Đã xóa thẻ");
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Xóa thất bại", "error");
    } finally {
      setDeleting(false);
    }
  };

  const openEditCard = (card: Card) => {
    setCardForm({ front: card.front, back: card.back, example: (card as any).example || "" });
    setEditCard(card);
    setShowAddCard(false);
  };

  const CardFormFields = ({ onSubmit, label }: { onSubmit: () => void; label: string }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", display: "block", marginBottom: 6 }}>
          Mặt trước (từ) *
        </label>
        <input
          type="text"
          value={cardForm.front}
          onChange={(e) => setCardForm((f) => ({ ...f, front: e.target.value }))}
          placeholder="Ví dụ: apple"
          className="input-field"
          style={{ width: "100%", boxSizing: "border-box" }}
        />
      </div>
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", display: "block", marginBottom: 6 }}>
          Mặt sau (nghĩa) *
        </label>
        <input
          type="text"
          value={cardForm.back}
          onChange={(e) => setCardForm((f) => ({ ...f, back: e.target.value }))}
          placeholder="Ví dụ: quả táo"
          className="input-field"
          style={{ width: "100%", boxSizing: "border-box" }}
        />
      </div>
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", display: "block", marginBottom: 6 }}>
          Ví dụ (tuỳ chọn)
        </label>
        <textarea
          value={cardForm.example}
          onChange={(e) => setCardForm((f) => ({ ...f, example: e.target.value }))}
          placeholder="I eat an apple every day."
          rows={2}
          className="input-field"
          style={{ width: "100%", boxSizing: "border-box", resize: "vertical" }}
        />
      </div>
      <button
        onClick={onSubmit}
        disabled={saving || !cardForm.front.trim() || !cardForm.back.trim()}
        style={{
          padding: "13px",
          background:
            saving || !cardForm.front.trim() || !cardForm.back.trim() ? "var(--cream-2)" : "var(--navy)",
          color:
            saving || !cardForm.front.trim() || !cardForm.back.trim() ? "var(--muted)" : "white",
          border: "none",
          borderRadius: 12,
          fontWeight: 700,
          fontSize: 15,
          cursor: saving ? "not-allowed" : "pointer",
          fontFamily: "'Outfit',sans-serif",
        }}
      >
        {saving ? "Đang lưu..." : label}
      </button>
    </div>
  );

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
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Đã nhớ ✅</div>
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
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Cần ôn thêm ❌</div>
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
          <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>
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

        <div className="flip-card" style={{ marginBottom: 24 }} onClick={() => setCardFlip((f) => !f)}>
          <div className={`flip-card-inner${cardFlip ? " flipped" : ""}`} style={{ height: 300 }}>
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
              {/* nút Play ở góc (stopPropagation để ko làm lật thẻ) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio(card.front);
                }}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 18,
                }}
                aria-label="play front"
              >
                🔊
              </button>

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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio(card.back);
                }}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 18,
                }}
                aria-label="play back"
              >
                🔊
              </button>

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

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
          {cardFlip ? "Đánh giá mức độ ghi nhớ của bạn" : "Nhấn vào thẻ để xem đáp án"}
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

  /* ── Card grid view / Manage view ── */
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
            <div key={i} className="skeleton" style={{ borderRadius: 18, height: 180 }} />
          ))}
        </div>
      </div>
    );

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="animate-fade-up" style={{ marginBottom: 24 }}>
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
            marginBottom: 8,
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

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setTab("cards")}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  background: tab === "cards" ? "var(--navy)" : "var(--cream-2)",
                  color: tab === "cards" ? "white" : "var(--navy)",
                  fontWeight: 700,
                }}
              >
                Danh sách
              </button>
              {isOwner && (
                <button
                  onClick={() => setTab("manage")}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "none",
                    cursor: "pointer",
                    background: tab === "manage" ? "var(--navy)" : "var(--cream-2)",
                    color: tab === "manage" ? "white" : "var(--navy)",
                    fontWeight: 700,
                  }}
                >
                  Quản lý
                </button>
              )}
            </div>

            <button
              onClick={() => setStudyMode(true)}
              style={{
                background: "var(--emerald)",
                color: "var(--navy)",
                padding: "12px 20px",
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
      </div>

      {tab === "cards" && (
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
              onClick={() => setFlipped((f) => ({ ...f, [card._id]: !f[card._id] }))}
              style={{ cursor: "pointer", position: "relative" }}
            >
              {/* overlay controls (chỉ hiện với owner) */}
              {isOwner && (
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    display: "flex",
                    gap: 8,
                    zIndex: 5,
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudio(card.front);
                    }}
                    title="Nghe"
                    style={{
                      border: "none",
                      background: "rgba(255,255,255,0.9)",
                      padding: 8,
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: 16,
                    }}
                  >
                    🔊
                  </button>




                </div>
              )}

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
                      background: "linear-gradient(135deg,var(--navy),var(--navy-2))",
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
      )}

      {tab === "manage" && isOwner && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <div style={{ color: "var(--muted)" }}>{cards.length} thẻ</div>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => {
                  setCardForm(emptyCardForm);
                  setShowAddCard(true);
                  setEditCard(null);
                }}
                style={{
                  background: "var(--navy)",
                  color: "white",
                  padding: "10px 16px",
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                + Thêm thẻ
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
                style={{ position: "relative" }}
              >
                <div
                  className="card-manage"
                  style={{
                    background: "white",
                    borderRadius: 12,
                    padding: 16,
                    border: "1.5px solid var(--border)",
                    minHeight: 140,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'Fraunces',serif",
                          fontSize: 20,
                          fontWeight: 700,
                          color: "var(--navy)",
                          marginBottom: 8,
                          flex: 1,
                        }}
                      >
                        {card.front}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playAudio(card.front);
                        }}
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          fontSize: 18,
                          padding: 4,
                        }}
                        title="Nghe"
                      >
                        🔊
                      </button>
                    </div>
                    <div style={{ color: "var(--muted)", fontSize: 14 }}>{card.back}</div>
                    {(card as any).example && (
                      <div style={{ marginTop: 8, fontSize: 13, color: "var(--muted)" }}>
                        {(card as any).example}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button
                      onClick={() => openEditCard(card)}
                      style={{
                        flex: 1,
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                        cursor: "pointer",
                        background: "var(--cream-2)",
                        fontWeight: 700,
                      }}
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      onClick={() => setDeleteCard(card)}
                      style={{
                        flex: 1,
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,107,107,0.2)",
                        cursor: "pointer",
                        background: "rgba(255,107,107,.08)",
                        color: "#FF6B6B",
                        fontWeight: 700,
                      }}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Card Modal */}
      {showAddCard && (
        <Modal
          title="Thêm thẻ mới"
          onClose={() => {
            setShowAddCard(false);
            setCardForm(emptyCardForm);
          }}
        >
          <CardFormFields onSubmit={handleAddCard} label="Thêm thẻ" />
        </Modal>
      )}

      {/* Edit Card Modal */}
      {editCard && (
        <Modal
          title="Chỉnh sửa thẻ"
          onClose={() => {
            setEditCard(null);
            setCardForm(emptyCardForm);
          }}
        >
          <CardFormFields onSubmit={handleUpdateCard} label="Lưu thay đổi" />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCard && (
        <Modal
          title="Xác nhận xóa"
          onClose={() => {
            setDeleteCard(null);
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ margin: 0 }}>
              Bạn có chắc muốn xóa thẻ <strong>{deleteCard.front}</strong>? Hành động này không thể hoàn tác.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setDeleteCard(null)}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                Huỷ
              </button>
              <button
                onClick={handleDeleteCard}
                disabled={deleting}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: deleting ? "var(--cream-2)" : "#FF6B6B",
                  color: "white",
                  cursor: deleting ? "not-allowed" : "pointer",
                }}
              >
                {deleting ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}