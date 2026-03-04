import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import type { Deck } from "../types/deck";

const FLAG: Record<string, string> = { en: "🇬🇧", ja: "🇯🇵", fr: "🇫🇷", zh: "🇨🇳", de: "🇩🇪", ko: "🇰🇷" };
const LANGS = ["en", "ja", "fr", "zh", "de", "ko"];

interface DeckForm {
  name: string;
  description: string;
  language: string;
  isPublic: boolean;
}

const emptyForm: DeckForm = { name: "", description: "", language: "en", isPublic: true };

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: "white", borderRadius: 24, padding: "32px 36px",
        width: "100%", maxWidth: 480, boxShadow: "0 24px 60px rgba(0,0,0,.2)",
        animation: "fadeIn .2s ease",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 22, color: "var(--navy)" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "var(--cream-2)", border: "none", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <div style={{
      position: "fixed", top: 20, right: 20, zIndex: 9999,
      background: type === "success" ? "#00c896" : "#FF6B6B",
      color: type === "success" ? "var(--navy)" : "white",
      padding: "14px 20px", borderRadius: 12, fontWeight: 600, fontSize: 14,
      boxShadow: "0 4px 20px rgba(0,0,0,.25)", maxWidth: 320,
    }}>{msg}</div>
  );
}

function DeckForm({ form, setForm, onSubmit, saving, label }: {
  form: DeckForm;
  setForm: React.Dispatch<React.SetStateAction<DeckForm>>;
  onSubmit: () => void;
  saving: boolean;
  label: string;
}) {
  const LANGS = ["en", "ja", "fr", "zh", "de", "ko"];
  const FLAG: Record<string, string> = { en:"🇬🇧", ja:"🇯🇵", fr:"🇫🇷", zh:"🇨🇳", de:"🇩🇪", ko:"🇰🇷" };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div>
        <label style={{ fontSize:13, fontWeight:600, color:"var(--text)", display:"block", marginBottom:6 }}>Tên bộ deck *</label>
        <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Ví dụ: English Deck"
          className="input-field" style={{ width:"100%", boxSizing:"border-box" }} />
      </div>
      <div>
        <label style={{ fontSize:13, fontWeight:600, color:"var(--text)", display:"block", marginBottom:6 }}>Mô tả</label>
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Mô tả ngắn về bộ từ vựng..."
          rows={3} className="input-field" style={{ width:"100%", boxSizing:"border-box", resize:"vertical" }} />
      </div>
      <div>
        <label style={{ fontSize:13, fontWeight:600, color:"var(--text)", display:"block", marginBottom:8 }}>Ngôn ngữ</label>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {LANGS.map(l => (
            <button key={l} onClick={() => setForm(f => ({ ...f, language: l }))}
              style={{ padding:"7px 14px", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer",
                border: form.language === l ? "2px solid var(--navy)" : "1.5px solid var(--border)",
                background: form.language === l ? "var(--navy)" : "white",
                color: form.language === l ? "white" : "var(--text)" }}>
              {FLAG[l]} {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <label style={{ fontSize:13, fontWeight:600, color:"var(--text)" }}>Công khai</label>
        <button onClick={() => setForm(f => ({ ...f, isPublic: !f.isPublic }))}
          style={{ width:44, height:24, borderRadius:12, border:"none", cursor:"pointer",
            background: form.isPublic ? "var(--emerald)" : "var(--cream-2)",
            position:"relative", transition:"background .2s" }}>
          <span style={{ position:"absolute", width:18, height:18, borderRadius:"50%", background:"white",
            top:3, left: form.isPublic ? "calc(100% - 21px)" : 3, transition:"left .2s",
            boxShadow:"0 1px 4px rgba(0,0,0,.2)" }} />
        </button>
        <span style={{ fontSize:12, color:"var(--muted)" }}>{form.isPublic ? "🌍 Mọi người có thể xem" : "🔒 Chỉ mình bạn"}</span>
      </div>
      <button onClick={onSubmit} disabled={saving || !form.name.trim()}
        style={{ marginTop:8, padding:"13px",
          background: saving || !form.name.trim() ? "var(--cream-2)" : "var(--navy)",
          color: saving || !form.name.trim() ? "var(--muted)" : "white",
          border:"none", borderRadius:12, fontWeight:700, fontSize:15,
          cursor: saving ? "not-allowed" : "pointer",
          fontFamily:"'Outfit',sans-serif", transition:"all .2s" }}>
        {saving ? "Đang lưu..." : label}
      </button>
    </div>
  );
}

export default function MyDecksPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editDeck, setEditDeck] = useState<Deck | null>(null);
  const [deleteDeck, setDeleteDeck] = useState<Deck | null>(null);
  const [form, setForm] = useState<DeckForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchMyDecks = () => {
    setLoading(true);
    api.get("/decks/my")
      .then(res => setDecks(res.data?.success ? res.data.data || [] : []))
      .catch(() => setDecks([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchMyDecks();
  }, [user]);

  const openCreate = () => { setForm(emptyForm); setShowCreate(true); };
  const openEdit = (d: Deck) => { setForm({ name: d.name, description: d.description || "", language: d.language, isPublic: d.isPublic }); setEditDeck(d); };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await api.post("/decks", form);
      if (res.data?.success) {
        setDecks(prev => [res.data.data, ...prev]);
        setShowCreate(false);
        showToast("Tạo bộ deck thành công! 🎉");
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Tạo deck thất bại", "error");
    } finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!editDeck || !form.name.trim()) return;
    setSaving(true);
    try {
      const res = await api.put(`/decks/${editDeck._id}`, form);
      if (res.data?.success) {
        setDecks(prev => prev.map(d => d._id === editDeck._id ? res.data.data : d));
        setEditDeck(null);
        showToast("Cập nhật deck thành công! ✅");
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Cập nhật thất bại", "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteDeck) return;
    setDeleting(true);
    try {
      await api.delete(`/decks/${deleteDeck._id}`);
      setDecks(prev => prev.filter(d => d._id !== deleteDeck._id));
      setDeleteDeck(null);
      showToast("Đã xóa deck thành công");
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Xóa thất bại", "error");
    } finally { setDeleting(false); }
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
      {toast && <Toast {...toast} />}

      {/* Header */}
      <div className="animate-fade-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "clamp(24px,4vw,36px)", color: "var(--navy)", marginBottom: 6 }}>
            Deck của tôi
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 15 }}>
            {decks.length} bộ flashcard • Quản lý và học từ vựng của bạn
          </p>
        </div>
        <button onClick={openCreate}
          style={{
            background: "var(--navy)", color: "white", padding: "12px 24px", borderRadius: 14,
            border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer",
            fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 8,
            boxShadow: "0 8px 24px rgba(13,27,42,.2)",
          }}>
          ＋ Tạo deck mới
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 24 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ borderRadius: 20, height: 220 }} />
          ))}
        </div>
      ) : decks.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 24px" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📭</div>
          <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 22, color: "var(--navy)", marginBottom: 8 }}>Chưa có deck nào</h3>
          <p style={{ color: "var(--muted)", marginBottom: 28 }}>Tạo bộ flashcard đầu tiên để bắt đầu học nhé!</p>
          <button onClick={openCreate}
            style={{ background: "var(--emerald)", color: "var(--navy)", padding: "13px 32px", borderRadius: 14, border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
            ＋ Tạo deck đầu tiên
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 24 }}>
          {decks.map((deck, i) => (
            <div key={deck._id} className={`animate-fade-up stagger-${Math.min(i + 1, 6)}`}>
              <div className="deck-card" style={{ position: "relative" }}>
                {/* Badge */}
                <div style={{ position: "absolute", top: 16, right: 16 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                    background: deck.isPublic ? "rgba(0,200,150,.12)" : "rgba(100,100,100,.1)",
                    color: deck.isPublic ? "var(--emerald-d)" : "var(--muted)",
                  }}>
                    {deck.isPublic ? "🌍 Công khai" : "🔒 Riêng tư"}
                  </span>
                </div>

                <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--cream-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>
                  {FLAG[deck.language] || "🌐"}
                </div>

                <h3 style={{ fontWeight: 700, fontSize: 16, color: "var(--navy)", marginBottom: 6, lineHeight: 1.3, paddingRight: 80 }}>{deck.name}</h3>
                <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 16, minHeight: 40 }}>{deck.description || "—"}</p>

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>{FLAG[deck.language]} {deck.language.toUpperCase()}</span>
                  <span style={{ color: "var(--border)" }}>·</span>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>📇 {deck.cardCount} thẻ</span>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8 }}>
                  <Link to={`/decks/${deck._id}`}
                    style={{ flex: 1, textAlign: "center", padding: "9px", background: "var(--navy)", color: "white", borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                    📖 Xem
                  </Link>
                  <button onClick={() => openEdit(deck)}
                    style={{ padding: "9px 14px", background: "var(--cream-2)", color: "var(--text)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    ✏️ Sửa
                  </button>
                  <button onClick={() => setDeleteDeck(deck)}
                    style={{ padding: "9px 14px", background: "rgba(255,107,107,.1)", color: "#FF6B6B", border: "1.5px solid rgba(255,107,107,.2)", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Tạo bộ deck mới ✨" onClose={() => setShowCreate(false)}>
          <DeckForm form={form} setForm={setForm} onSubmit={handleCreate} saving={saving} label="Tạo deck 🚀" />
        </Modal>
      )}

      {/* Edit Modal */}
      {editDeck && (
        <Modal title="Chỉnh sửa deck" onClose={() => setEditDeck(null)}>
          <DeckForm form={form} setForm={setForm} onSubmit={handleUpdate} saving={saving} label="Lưu thay đổi ✅" />
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {deleteDeck && (
        <Modal title="Xác nhận xóa" onClose={() => setDeleteDeck(null)}>
          <p style={{ color: "var(--muted)", fontSize: 15, marginBottom: 8 }}>
            Bạn có chắc muốn xóa deck <strong style={{ color: "var(--navy)" }}>"{deleteDeck.name}"</strong>?
          </p>
          <p style={{ fontSize: 13, color: "#FF6B6B", marginBottom: 28 }}>
            ⚠️ Hành động này không thể hoàn tác. Tất cả {deleteDeck.cardCount} thẻ sẽ bị xóa.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => setDeleteDeck(null)}
              style={{ flex: 1, padding: "12px", background: "var(--cream-2)", color: "var(--text)", border: "none", borderRadius: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
              Hủy
            </button>
            <button onClick={handleDelete} disabled={deleting}
              style={{ flex: 1, padding: "12px", background: deleting ? "var(--cream-2)" : "#FF6B6B", color: deleting ? "var(--muted)" : "white", border: "none", borderRadius: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
              {deleting ? "Đang xóa..." : "Xóa deck 🗑️"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}