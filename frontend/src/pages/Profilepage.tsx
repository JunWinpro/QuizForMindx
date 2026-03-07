import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

/* ─── tiny helpers ────────────────────────────────────────────── */
function Toast({ msg, type }: { msg: string; type: "ok" | "err" }) {
  return (
    <div style={{
      position: "fixed", top: 24, right: 24, zIndex: 9999,
      background: type === "ok" ? "#00c896" : "#FF6B6B",
      color: type === "ok" ? "#0D1B2A" : "white",
      padding: "14px 22px", borderRadius: 14, fontWeight: 700,
      fontSize: 14, boxShadow: "0 8px 32px rgba(0,0,0,.25)",
      animation: "slideInRight .3s ease",
    }}>
      {msg}
    </div>
  );
}

/* ─── avatar with photo or initials ─────────────────────────────── */
function Avatar({ user, size = 96 }: { user: any; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const initials = user?.displayName
    ? user.displayName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  if (user?.photoUrl && !imgError) {
    return (
      <img
        src={user.photoUrl}
        alt={user.displayName}
        onError={() => setImgError(true)}
        style={{
          width: size, height: size, borderRadius: "50%",
          objectFit: "cover", flexShrink: 0,
          boxShadow: "0 0 0 4px rgba(0,200,150,.35), 0 0 0 8px rgba(0,200,150,.1)",
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg,#00c896,#00a87f)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 900, color: "#0D1B2A",
      fontFamily: "'Fraunces',serif", flexShrink: 0,
      boxShadow: "0 0 0 4px rgba(0,200,150,.35), 0 0 0 8px rgba(0,200,150,.1)",
    }}>
      {initials}
    </div>
  );
}

/* ─── stat card ──────────────────────────────────────────────────── */
function StatCard({ icon, label, value, accent = false }:
  { icon: string; label: string; value: string | number; accent?: boolean }) {
  return (
    <div style={{
      background: accent
        ? "linear-gradient(135deg,#00c896 0%,#00a87f 100%)"
        : "rgba(255,255,255,.06)",
      border: accent ? "none" : "1px solid rgba(255,255,255,.1)",
      borderRadius: 20, padding: "20px 22px",
      display: "flex", flexDirection: "column", gap: 6,
      transition: "transform .2s",
    }}
      onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-3px)")}
      onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
    >
      <span style={{ fontSize: 26 }}>{icon}</span>
      <span style={{
        fontSize: 28, fontWeight: 900,
        color: accent ? "#0D1B2A" : "white",
        fontFamily: "'Fraunces',serif", lineHeight: 1,
      }}>{value}</span>
      <span style={{
        fontSize: 12, fontWeight: 600,
        color: accent ? "rgba(13,27,42,.65)" : "rgba(255,255,255,.55)",
        letterSpacing: ".4px", textTransform: "uppercase",
      }}>{label}</span>
    </div>
  );
}

/* ─── input field ──────────────────────────────────────────────── */
function Field({
  label, value, onChange, type = "text", disabled = false,
  hint, error, placeholder,
}: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.7)", letterSpacing: ".3px" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        style={{
          padding: "12px 16px",
          background: disabled ? "rgba(255,255,255,.04)" : "rgba(255,255,255,.08)",
          border: `1.5px solid ${error ? "#FF6B6B" : "rgba(255,255,255,.15)"}`,
          borderRadius: 12,
          color: disabled ? "rgba(255,255,255,.35)" : "white",
          fontFamily: "'Outfit',sans-serif", fontSize: 15,
          outline: "none", cursor: disabled ? "not-allowed" : "text",
          transition: "border-color .2s",
          boxSizing: "border-box" as const, width: "100%",
        }}
        onFocus={e => { if (!disabled) e.target.style.borderColor = "#00c896"; }}
        onBlur={e => { e.target.style.borderColor = error ? "#FF6B6B" : "rgba(255,255,255,.15)"; }}
      />
      {error && <p style={{ fontSize: 12, color: "#FF6B6B", margin: 0 }}>{error}</p>}
      {hint && !error && <p style={{ fontSize: 12, color: "rgba(255,255,255,.35)", margin: 0 }}>{hint}</p>}
    </div>
  );
}

/* ─── main component ─────────────────────────────────────────────── */
export default function ProfilePage() {
  const { user, login, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<"profile" | "security">("profile");
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [saving, setSaving] = useState(false);

  // Profile form
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || "");

  // Password form
  const [pwForm, setPwForm] = useState({ cur: "", next: "", confirm: "" });
  const [pwErr, setPwErr] = useState<Record<string, string>>({});
  const [savingPw, setSavingPw] = useState(false);

  // Stats
  const [stats, setStats] = useState<any>(null);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    api.get("/stats/progress").then(r => {
      if (r.data?.success) setStats(r.data.data);
    }).catch(() => {});
    // Sync profile fields if user changes
    setDisplayName(user.displayName || "");
    setPhotoUrl(user.photoUrl || "");
  }, [user?._id]); // eslint-disable-line

  if (!user) return null;

  const isGoogleUser = !!user.googleId;
  const streak = user.stats?.streak ?? stats?.currentStreak ?? 0;
  const longest = user.stats?.longestStreak ?? stats?.longestStreak ?? 0;

  const handleSaveProfile = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      const res = await api.put("/auth/me", { displayName, photoUrl });
      if (res.data?.success) {
        login(res.data.token || localStorage.getItem("token")!, res.data.user);
        showToast("Cập nhật thành công! ✅");
      }
    } catch (e: any) {
      showToast(e?.response?.data?.message || "Cập nhật thất bại", "err");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const errs: Record<string, string> = {};
    if (!pwForm.cur) errs.cur = "Vui lòng nhập mật khẩu hiện tại";
    if (pwForm.next.length < 6) errs.next = "Tối thiểu 6 ký tự";
    if (pwForm.next !== pwForm.confirm) errs.confirm = "Mật khẩu không khớp";
    setPwErr(errs);
    if (Object.keys(errs).length > 0) return;
    setSavingPw(true);
    try {
      await api.put("/auth/change-password", { currentPassword: pwForm.cur, newPassword: pwForm.next });
      setPwForm({ cur: "", next: "", confirm: "" });
      setPwErr({});
      showToast("Đổi mật khẩu thành công! 🔐");
    } catch (e: any) {
      showToast(e?.response?.data?.message || "Đổi mật khẩu thất bại", "err");
    } finally {
      setSavingPw(false);
    }
  };

  /* ── RENDER ───────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: "var(--navy)", paddingBottom: 64 }}>
      <style>{`
        @keyframes slideInRight {
          from { opacity:0; transform:translateX(24px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .prof-card { animation: fadeUp .5s ease both; }
        .tab-btn { transition: all .2s; }
        .tab-btn:hover { color: white !important; }
        .save-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(0,200,150,.35) !important;
        }
        .save-btn { transition: all .2s; }
      `}</style>

      {toast && <Toast {...toast} />}

      {/* ── HERO HEADER ─────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(180deg,rgba(0,200,150,.12) 0%,transparent 100%)",
        borderBottom: "1px solid rgba(255,255,255,.07)",
        padding: "48px 24px 40px",
      }}>
        {/* Decorative dots */}
        <div style={{
          position: "absolute", top: 80, right: "15%", width: 200, height: 200,
          borderRadius: "50%",
          background: "radial-gradient(circle,rgba(0,200,150,.08) 0%,transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{
          maxWidth: 760, margin: "0 auto",
          display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap",
        }}>
          {/* Avatar */}
          <div style={{ position: "relative" }}>
            <Avatar user={user} size={96} />
            {streak > 0 && (
              <div style={{
                position: "absolute", bottom: -4, right: -4,
                background: "#FF9F1C", borderRadius: "50%",
                width: 28, height: 28,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, border: "2px solid var(--navy)",
                boxShadow: "0 2px 8px rgba(255,159,28,.5)",
              }}>🔥</div>
            )}
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{
              fontFamily: "'Fraunces',serif", fontWeight: 900,
              fontSize: "clamp(22px,4vw,32px)", color: "white",
              margin: 0, lineHeight: 1.1,
            }}>
              {user.displayName || "Người dùng"}
            </h1>
            <p style={{ color: "rgba(255,255,255,.45)", fontSize: 14, margin: "6px 0 12px" }}>
              {user.email}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {isGoogleUser && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  background: "rgba(66,133,244,.15)", border: "1px solid rgba(66,133,244,.3)",
                  borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600,
                  color: "#7eb3ff",
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google Account
                </span>
              )}
              {user.role && (
                <span style={{
                  background: "rgba(0,200,150,.15)", border: "1px solid rgba(0,200,150,.3)",
                  borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700,
                  color: "#00c896", textTransform: "capitalize",
                }}>
                  {user.role === "teacher" ? "👩‍🏫 Giáo viên" : "🎓 Học viên"}
                </span>
              )}
            </div>
          </div>

          {/* Quick streak badge */}
          {streak > 0 && (
            <div style={{
              background: "linear-gradient(135deg,rgba(255,159,28,.2),rgba(255,107,107,.1))",
              border: "1px solid rgba(255,159,28,.3)",
              borderRadius: 20, padding: "16px 22px", textAlign: "center",
            }}>
              <div style={{ fontSize: 32, lineHeight: 1 }}>🔥</div>
              <div style={{
                fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 900,
                color: "#FF9F1C", lineHeight: 1.1, marginTop: 4,
              }}>{streak}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.45)", fontWeight: 600, letterSpacing: ".4px", textTransform: "uppercase" }}>
                ngày liên tiếp
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── STATS GRID ──────────────────────────────────────────── */}
      {stats && (
        <div className="prof-card" style={{
          maxWidth: 760, margin: "28px auto 0", padding: "0 24px",
          animationDelay: ".1s",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
            gap: 12,
          }}>
            <StatCard icon="📚" label="Từ đã học" value={stats.totalWordsLearned ?? 0} accent />
            <StatCard icon="🎯" label="Độ chính xác" value={`${stats.averageAccuracy ?? 0}%`} />
            <StatCard icon="🏆" label="Longest streak" value={`${longest}d`} />
            <StatCard icon="📝" label="Tổng quiz" value={stats.totalQuizzes ?? 0} />
          </div>
        </div>
      )}

      {/* ── TABS ────────────────────────────────────────────────── */}
      <div className="prof-card" style={{
        maxWidth: 760, margin: "28px auto 0", padding: "0 24px",
        animationDelay: ".15s",
      }}>
        <div style={{
          display: "flex", gap: 2,
          borderBottom: "1px solid rgba(255,255,255,.1)",
        }}>
          {[
            { key: "profile", label: "Thông tin cá nhân" },
            { key: "security", label: "Bảo mật" },
          ].map(t => (
            <button key={t.key} className="tab-btn"
              onClick={() => setTab(t.key as any)}
              style={{
                padding: "12px 22px", border: "none", background: "none", cursor: "pointer",
                fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 14,
                color: tab === t.key ? "#00c896" : "rgba(255,255,255,.45)",
                borderBottom: tab === t.key ? "2px solid #00c896" : "2px solid transparent",
                marginBottom: -1, transition: "all .2s",
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── PROFILE TAB ─────────────────────────────────────────── */}
      {tab === "profile" && (
        <div className="prof-card" style={{
          maxWidth: 760, margin: "20px auto 0", padding: "0 24px",
          animationDelay: ".2s",
        }}>
          <div style={{
            background: "rgba(255,255,255,.04)",
            border: "1px solid rgba(255,255,255,.1)",
            borderRadius: 24, padding: "32px",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <Field
                label="Họ và tên"
                value={displayName}
                onChange={(e: any) => setDisplayName(e.target.value)}
                placeholder="Nhập tên hiển thị..."
              />
              <Field
                label="Email"
                value={user.email}
                disabled
                hint="Email không thể thay đổi"
              />
              <Field
                label="Ảnh đại diện (URL)"
                value={photoUrl}
                onChange={(e: any) => setPhotoUrl(e.target.value)}
                placeholder="https://..."
                hint="Dán link ảnh hoặc dùng ảnh Google mặc định"
              />

              {/* Preview ảnh mới */}
              {photoUrl && photoUrl !== user.photoUrl && (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <img
                    src={photoUrl}
                    alt="preview"
                    style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "2px solid #00c896" }}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,.45)" }}>Xem trước ảnh mới</span>
                </div>
              )}

              <button className="save-btn"
                onClick={handleSaveProfile}
                disabled={saving || !displayName.trim()}
                style={{
                  padding: "14px", marginTop: 4,
                  background: saving || !displayName.trim()
                    ? "rgba(255,255,255,.08)"
                    : "linear-gradient(135deg,#00c896,#00a87f)",
                  color: saving || !displayName.trim() ? "rgba(255,255,255,.3)" : "#0D1B2A",
                  border: "none", borderRadius: 14,
                  fontWeight: 800, fontSize: 15, cursor: saving ? "not-allowed" : "pointer",
                  fontFamily: "'Outfit',sans-serif",
                }}>
                {saving ? "Đang lưu..." : "Lưu thay đổi →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SECURITY TAB ────────────────────────────────────────── */}
      {tab === "security" && (
        <div className="prof-card" style={{
          maxWidth: 760, margin: "20px auto 0", padding: "0 24px",
          animationDelay: ".2s",
        }}>
          <div style={{
            background: "rgba(255,255,255,.04)",
            border: "1px solid rgba(255,255,255,.1)",
            borderRadius: 24, padding: "32px",
          }}>
            {isGoogleUser ? (
              /* Google user — không có password */
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
                <h3 style={{ color: "white", fontFamily: "'Fraunces',serif", fontWeight: 700, margin: "0 0 10px" }}>
                  Đăng nhập qua Google
                </h3>
                <p style={{ color: "rgba(255,255,255,.45)", fontSize: 14, lineHeight: 1.6, maxWidth: 340, margin: "0 auto" }}>
                  Tài khoản của bạn được bảo mật bởi Google. Để thay đổi mật khẩu, vui lòng quản lý tài khoản Google của bạn.
                </p>
                <a
                  href="https://myaccount.google.com/security"
                  target="_blank" rel="noreferrer"
                  style={{
                    display: "inline-block", marginTop: 20,
                    padding: "12px 24px", borderRadius: 12,
                    background: "rgba(66,133,244,.15)", border: "1px solid rgba(66,133,244,.3)",
                    color: "#7eb3ff", fontWeight: 600, fontSize: 14, textDecoration: "none",
                  }}>
                  Quản lý tài khoản Google →
                </a>
              </div>
            ) : (
              /* Email user — có thể đổi password */
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <h3 style={{ color: "white", fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 18, margin: 0 }}>
                  Đổi mật khẩu
                </h3>
                <Field
                  label="Mật khẩu hiện tại"
                  type="password"
                  value={pwForm.cur}
                  onChange={(e: any) => setPwForm(f => ({ ...f, cur: e.target.value }))}
                  placeholder="••••••••"
                  error={pwErr.cur}
                />
                <Field
                  label="Mật khẩu mới"
                  type="password"
                  value={pwForm.next}
                  onChange={(e: any) => setPwForm(f => ({ ...f, next: e.target.value }))}
                  placeholder="Tối thiểu 6 ký tự"
                  error={pwErr.next}
                />
                <Field
                  label="Xác nhận mật khẩu mới"
                  type="password"
                  value={pwForm.confirm}
                  onChange={(e: any) => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                  placeholder="Nhập lại mật khẩu mới"
                  error={pwErr.confirm}
                />
                <button className="save-btn"
                  onClick={handleChangePassword} disabled={savingPw}
                  style={{
                    padding: "14px", marginTop: 4,
                    background: savingPw ? "rgba(255,255,255,.08)" : "linear-gradient(135deg,#00c896,#00a87f)",
                    color: savingPw ? "rgba(255,255,255,.3)" : "#0D1B2A",
                    border: "none", borderRadius: 14,
                    fontWeight: 800, fontSize: 15, cursor: savingPw ? "not-allowed" : "pointer",
                    fontFamily: "'Outfit',sans-serif",
                  }}>
                  {savingPw ? "Đang lưu..." : "Đổi mật khẩu →"}
                </button>
              </div>
            )}
          </div>

          {/* Danger zone */}
          <div style={{
            marginTop: 20, padding: "24px 28px",
            border: "1px solid rgba(255,107,107,.25)",
            borderRadius: 20,
            background: "rgba(255,107,107,.04)",
          }}>
            <p style={{ color: "#FF6B6B", fontWeight: 700, fontSize: 14, margin: "0 0 6px" }}>
              ⚠️ Đăng xuất
            </p>
            <p style={{ color: "rgba(255,255,255,.4)", fontSize: 13, margin: "0 0 16px" }}>
              Đăng xuất khỏi tài khoản trên thiết bị này.
            </p>
            <button
              onClick={() => { logout(); navigate("/"); }}
              style={{
                padding: "10px 22px",
                background: "rgba(255,107,107,.12)", color: "#FF6B6B",
                border: "1px solid rgba(255,107,107,.3)", borderRadius: 10,
                fontWeight: 700, fontSize: 14, cursor: "pointer",
                fontFamily: "'Outfit',sans-serif", transition: "all .2s",
              }}
              onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = "rgba(255,107,107,.22)"; }}
              onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = "rgba(255,107,107,.12)"; }}
            >
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}