import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  example?: string;
}

const emptyForm: CardForm = { front: "", back: "", example: "" };

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 560, background: "white", borderRadius: 12, padding: 20 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ border: "none", background: "transparent", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <div style={{ position: "fixed", right: 20, top: 20, zIndex: 2000, padding: "10px 14px", borderRadius: 10, background: type === "success" ? "#00c896" : "#ff6b6b", color: "#042028", fontWeight: 700 }}>
      {msg}
    </div>
  );
}

export default function DeckManage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [deck, setDeck] = useState<DeckInfo | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [editCard, setEditCard] = useState<Card | null>(null);
  const [deleteCard, setDeleteCard] = useState<Card | null>(null);

  const [form, setForm] = useState<CardForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const showToast = (msg: string, type: "success" | "error" = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const isOwner = !!(user && deck && user._id === deck.ownerId);

  // TTS helper
  const langMap: Record<string, string> = { en: "en-US", ja: "ja-JP", fr: "fr-FR", zh: "zh-CN", de: "de-DE", ko: "ko-KR" };
  const playAudio = (text: string) => {
    if (!text) return;
    if (!("speechSynthesis" in window)) { showToast("Trình duyệt không hỗ trợ TTS", "error"); return; }
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = (deck && langMap[deck.language]) || "en-US";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (e) {
      showToast("Không thể phát âm", "error");
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
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [id]);

  // Handlers
  const submitAdd = async () => {
    if (!id) return;
    if (!form.front.trim() || !form.back.trim()) return showToast("Nhập đầy đủ mặt trước / mặt sau", "error");
    setSaving(true);
    try {
      const res = await api.post(`/decks/${id}/cards`, form);
      if (res.data?.success) {
        setCards((p) => [...p, res.data.data]);
        if (deck) setDeck({ ...deck, cardCount: deck.cardCount + 1 });
        setForm(emptyForm);
        setShowAdd(false);
        showToast("Thêm thẻ thành công");
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Thêm thất bại", "error");
    } finally { setSaving(false); }
  };

  const submitUpdate = async () => {
    if (!id || !editCard) return;
    if (!form.front.trim() || !form.back.trim()) return showToast("Nhập đầy đủ mặt trước / mặt sau", "error");
    setSaving(true);
    try {
      const res = await api.put(`/decks/${id}/cards/${editCard._id}`, form);
      if (res.data?.success) {
        setCards((p) => p.map((c) => (c._id === editCard._id ? res.data.data : c)));
        setEditCard(null);
        setForm(emptyForm);
        showToast("Cập nhật thành công");
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Cập nhật thất bại", "error");
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!id || !deleteCard) return;
    setDeleting(true);
    try {
      await api.delete(`/decks/${id}/cards/${deleteCard._id}`);
      setCards((p) => p.filter((c) => c._id !== deleteCard._id));
      if (deck) setDeck({ ...deck, cardCount: Math.max(0, deck.cardCount - 1) });
      setDeleteCard(null);
      showToast("Đã xóa");
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Xóa thất bại", "error");
    } finally { setDeleting(false); }
  };

  const openEdit = (c: Card) => {
    setEditCard(c);
    setForm({ front: c.front, back: c.back, example: (c as any).example || "" });
    setShowAdd(false);
  };

  if (loading) return <div style={{ padding: 40 }}>Đang tải...</div>;

  if (!deck) return <div style={{ padding: 40 }}>Không tìm thấy bộ thẻ.</div>;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <button onClick={() => navigate(-1)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--muted)" }}>← Quay lại</button>
          <h1 style={{ margin: "6px 0 0 0", fontFamily: "'Fraunces', serif" }}>{deck.name}</h1>
          <div style={{ color: "var(--muted)" }}>{deck.cardCount} thẻ · {deck.language}</div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setShowAdd(true)} style={{ background: "var(--navy)", color: "white", padding: "10px 14px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700 }}>
            + Thêm thẻ
          </button>
          <button onClick={() => navigate(`/decks/${id}`)} style={{ background: "var(--cream-2)", color: "var(--navy)", padding: "10px 14px", borderRadius: 10, border: "none", cursor: "pointer" }}>
            Xem danh sách
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {cards.map((c) => (
          <div key={c._id} style={{ position: "relative", background: "white", borderRadius: 12, border: "1px solid var(--border)", padding: 16, minHeight: 140 }}>
            <div style={{ position: "absolute", right: 10, top: 10, display: "flex", gap: 8 }}>
              <button onClick={() => playAudio(c.front)} title="Nghe từ" style={{ border: "none", background: "rgba(255,255,255,0.9)", padding: 8, borderRadius: 8, cursor: "pointer" }}>🔊</button>
              {isOwner && (
                <>
                  <button onClick={() => openEdit(c)} title="Chỉnh sửa" style={{ border: "none", background: "rgba(0,0,0,0.06)", padding: 8, borderRadius: 8, cursor: "pointer" }}>✏️</button>
                  <button onClick={() => setDeleteCard(c)} title="Xóa" style={{ border: "none", background: "rgba(255,107,107,0.12)", padding: 8, borderRadius: 8, cursor: "pointer", color: "#FF6B6B" }}>🗑️</button>
                </>
              )}
            </div>

            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: "var(--navy)", marginBottom: 8 }}>{c.front}</div>
            <div style={{ color: "var(--muted)", marginBottom: 8 }}>{c.back}</div>
            {(c as any).example && <div style={{ color: "var(--muted)", fontSize: 13 }}>{(c as any).example}</div>}
          </div>
        ))}
      </div>

      {/* Add modal */}
      {showAdd && (
        <Modal title="Thêm thẻ mới" onClose={() => { setShowAdd(false); setForm(emptyForm); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label>Mặt trước *</label>
            <input value={form.front} onChange={(e) => setForm(f => ({ ...f, front: e.target.value }))} />
            <label>Mặt sau *</label>
            <input value={form.back} onChange={(e) => setForm(f => ({ ...f, back: e.target.value }))} />
            <label>Ví dụ (tuỳ chọn)</label>
            <textarea value={form.example} onChange={(e) => setForm(f => ({ ...f, example: e.target.value }))} rows={3} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => { setShowAdd(false); setForm(emptyForm); }} style={{ padding: "8px 12px" }}>Huỷ</button>
              <button onClick={submitAdd} disabled={saving} style={{ padding: "8px 12px", background: "var(--navy)", color: "white", border: "none", borderRadius: 8 }}>{saving ? "Đang lưu..." : "Thêm"}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit modal */}
      {editCard && (
        <Modal title="Chỉnh sửa thẻ" onClose={() => { setEditCard(null); setForm(emptyForm); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label>Mặt trước *</label>
            <input value={form.front} onChange={(e) => setForm(f => ({ ...f, front: e.target.value }))} />
            <label>Mặt sau *</label>
            <input value={form.back} onChange={(e) => setForm(f => ({ ...f, back: e.target.value }))} />
            <label>Ví dụ (tuỳ chọn)</label>
            <textarea value={form.example} onChange={(e) => setForm(f => ({ ...f, example: e.target.value }))} rows={3} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => { setEditCard(null); setForm(emptyForm); }} style={{ padding: "8px 12px" }}>Huỷ</button>
              <button onClick={submitUpdate} disabled={saving} style={{ padding: "8px 12px", background: "var(--navy)", color: "white", border: "none", borderRadius: 8 }}>{saving ? "Đang lưu..." : "Lưu"}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteCard && (
        <Modal title="Xác nhận xóa" onClose={() => setDeleteCard(null)}>
          <div>
            <p>Bạn có chắc muốn xóa thẻ <strong>{deleteCard.front}</strong>?</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteCard(null)} style={{ padding: "8px 12px" }}>Huỷ</button>
              <button onClick={confirmDelete} disabled={deleting} style={{ padding: "8px 12px", background: "#FF6B6B", color: "white", border: "none", borderRadius: 8 }}>{deleting ? "Đang xóa..." : "Xóa"}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}