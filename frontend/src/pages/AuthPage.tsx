import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginApi, registerApi } from "../api/auth";
import { useAuth } from "../context/AuthContext";
const GoogleLogin = () => {
  window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`;
};
interface AuthPageProps {
  type: "login" | "register";
}

export default function AuthPage({ type }: AuthPageProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">(type);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const { login } = useAuth();

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (mode === "register" && !form.name.trim()) e.name = "Vui lòng nhập họ tên";
    if (!form.email.includes("@"))               e.email = "Email không hợp lệ";
    if (form.password.length < 6)                e.password = "Mật khẩu tối thiểu 6 ký tự";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      if (mode === "login") {
        const res = await loginApi(form.email, form.password);
        if (res?.success) {
          login(res.token, res.user);
          showToast("success", `Chào mừng trở lại, ${res.user.displayName}! 👋`);
          setTimeout(() => navigate("/decks"), 1000);
        } else {
          setErrors({ general: "Đăng nhập thất bại" });
          showToast("error", "Đăng nhập thất bại");
        }
      } else {
        const res = await registerApi(form.email, form.password, form.name);
        if (res?.success) {
          login(res.token, res.user);
          showToast("success", `Tạo tài khoản thành công! Chào ${res.user.displayName} 🎉`);
          setTimeout(() => navigate("/decks"), 1000);
        } else {
          setErrors({ general: "Đăng ký thất bại" });
          showToast("error", "Đăng ký thất bại");
        }
      }
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || "Lỗi server, thử lại sau";
      setErrors({ general: msg });
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    "📚 Truy cập 10.000+ từ vựng miễn phí",
    "🧠 Thuật toán spaced repetition thông minh",
    "📊 Theo dõi tiến trình chi tiết mỗi ngày",
    "🏆 Thi đua cùng cộng đồng học viên",
    "🔊 Phát âm chuẩn từ người bản xứ",
  ];

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", display: "flex" }}>

      {/* ── Toast notification ── */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: toast.type === "success" ? "#00c896" : "#FF6B6B",
          color: toast.type === "success" ? "var(--navy)" : "white",
          padding: "14px 20px", borderRadius: 12, fontWeight: 600, fontSize: 14,
          boxShadow: "0 4px 20px rgba(0,0,0,.25)",
          animation: "slideIn .3s ease",
          maxWidth: 320,
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── Left panel (decorative) — hidden on mobile ── */}
      <div className="hidden md:flex" style={{
        flex: "0 0 420px", background: "linear-gradient(145deg, var(--navy), var(--navy-2))",
        flexDirection: "column", justifyContent: "center", padding: "60px 48px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "rgba(0,200,150,.08)", top: -60, right: -80, pointerEvents: "none" }}/>
        <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: "rgba(245,166,35,.06)", bottom: 40, left: -40, pointerEvents: "none" }}/>

        <div style={{ marginBottom: 40 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "linear-gradient(135deg, var(--emerald), #00a87f)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 900, color: "var(--navy)",
            fontFamily: "'Fraunces', serif", marginBottom: 16,
          }}>L</div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 28, color: "white", marginBottom: 10, lineHeight: 1.2 }}>
            Hành trình ngôn ngữ bắt đầu từ đây
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,.6)", lineHeight: 1.6 }}>
            Tham gia cùng 50.000+ học viên đang học tập mỗi ngày trên LexiLearn.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {benefits.map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--emerald)", flexShrink: 0 }}/>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,.8)", fontWeight: 500 }}>{b}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 48, background: "rgba(255,255,255,.06)", borderRadius: 16, padding: "20px 24px", border: "1px solid rgba(255,255,255,.1)" }}>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,.8)", lineHeight: 1.6, fontStyle: "italic", marginBottom: 12 }}>
            "LexiLearn giúp mình đạt IELTS 7.5 chỉ sau 3 tháng. Hệ thống luyện tập rất thông minh!"
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--emerald)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>👩‍💻</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>Minh Châu</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)" }}>IELTS 7.5 — Hà Nội</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 24px",
        backgroundImage: "radial-gradient(circle at 70% 30%, rgba(0,200,150,.05) 0%, transparent 50%)",
      }}>
        <div className="animate-fade-up" style={{ width: "100%", maxWidth: 420 }}>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 28, color: "var(--navy)", marginBottom: 8 }}>
              {mode === "login" ? "Chào mừng trở lại 👋" : "Tạo tài khoản miễn phí 🎉"}
            </h2>
            <p style={{ fontSize: 15, color: "var(--muted)" }}>
              {mode === "login"
                ? "Tiếp tục hành trình ngôn ngữ của bạn"
                : "Bắt đầu học từ vựng thông minh ngay hôm nay"}
            </p>
          </div>

          {/* General error banner */}
          {errors.general && (
            <div style={{
              background: "rgba(255,107,107,.1)", border: "1.5px solid rgba(255,107,107,.4)",
              borderRadius: 10, padding: "12px 16px", marginBottom: 20,
              fontSize: 14, color: "#FF6B6B", fontWeight: 500,
            }}>
              ⚠️ {errors.general}
            </div>
          )}

          {/* Social login */}
{/* Social login */}
<button 
  onClick={GoogleLogin}
  style={{
    width: "100%", padding: "12px", marginBottom: 20,
    border: "1.5px solid var(--border)", borderRadius: 12,
    background: "white", cursor: "pointer",
    fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 14, color: "var(--text)",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    transition: "all .2s",
  }}
>
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.7 6.5 29.1 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.5 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.7 6.5 29.1 4 24 4 16.2 4 9.5 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.8 13.5-4.7l-6.2-5.2C29.3 35.5 26.8 36 24 36c-5.2 0-9.6-2.9-11.4-7l-6.6 5.1C9.5 39.7 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.2 5.2C40.8 35.3 44 30 44 24c0-1.3-.1-2.7-.4-4z"/>
  </svg>
  Tiếp tục với Google
</button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }}/>
            <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>hoặc đăng nhập bằng email</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }}/>
          </div>

          {/* Form fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>

            {mode === "register" && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", display: "block", marginBottom: 6 }}>Họ và tên</label>
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input-field"
                  style={{ borderColor: errors.name ? "#FF6B6B" : undefined }}
                />
                {errors.name && <p style={{ fontSize: 12, color: "#FF6B6B", marginTop: 4 }}>{errors.name}</p>}
              </div>
            )}

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", display: "block", marginBottom: 6 }}>Email</label>
              <input
                type="email"
                placeholder="ban@email.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="input-field"
                style={{ borderColor: errors.email ? "#FF6B6B" : undefined }}
              />
              {errors.email && <p style={{ fontSize: 12, color: "#FF6B6B", marginTop: 4 }}>{errors.email}</p>}
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Mật khẩu</label>
                {mode === "login" && (
                  <a href="/forgot-password" style={{ fontSize: 12, color: "var(--emerald)", fontWeight: 600, textDecoration: "none" }}>
                    Quên mật khẩu?
                  </a>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input-field"
                  style={{ paddingRight: 44, borderColor: errors.password ? "#FF6B6B" : undefined }}
                />
                <button
                  onClick={() => setShowPassword(s => !s)}
                  style={{
                    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 16, color: "var(--muted)", lineHeight: 1,
                  }}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {errors.password && <p style={{ fontSize: 12, color: "#FF6B6B", marginTop: 4 }}>{errors.password}</p>}
            </div>

            {mode === "register" && form.password.length > 0 && (
              <div>
                <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3, 4].map(n => {
                    const strength = Math.min(
                      Math.floor(form.password.length / 3) +
                      (form.password.match(/[A-Z]/) ? 1 : 0) +
                      (form.password.match(/[0-9]/) ? 1 : 0),
                      4
                    );
                    return (
                      <div key={n} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        background: n <= strength
                          ? strength <= 1 ? "#FF6B6B" : strength <= 2 ? "#F5A623" : strength <= 3 ? "#45B7D1" : "var(--emerald)"
                          : "var(--cream-2)",
                        transition: "background .3s",
                      }}/>
                    );
                  })}
                </div>
                <p style={{ fontSize: 11, color: "var(--muted)" }}>
                  {form.password.length < 6 ? "Quá ngắn" : form.password.length < 9 ? "Trung bình" : "Mật khẩu mạnh ✅"}
                </p>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%", padding: "14px",
              background: loading ? "var(--cream-2)" : "var(--navy)",
              color: loading ? "var(--muted)" : "white",
              border: "none", borderRadius: 12, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 15,
              transition: "all .25s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: loading ? "none" : "0 4px 16px rgba(13,27,42,.2)",
            }}
          >
            {loading
              ? <><span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid var(--muted)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }}/> Đang xử lý...</>
              : mode === "login" ? "Đăng nhập →" : "Tạo tài khoản miễn phí 🎉"}
          </button>

          <p style={{ textAlign: "center", fontSize: 14, color: "var(--muted)", marginTop: 24 }}>
            {mode === "login" ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setErrors({}); }}
              style={{
                background: "none", border: "none", color: "var(--emerald)",
                fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif", fontSize: 14,
              }}
            >
              {mode === "login" ? "Đăng ký ngay" : "Đăng nhập"}
            </button>
          </p>

          {mode === "register" && (
            <p style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", marginTop: 16, lineHeight: 1.6 }}>
              Bằng cách đăng ký, bạn đồng ý với{" "}
              <a href="/terms" style={{ color: "var(--navy)", fontWeight: 600, textDecoration: "none" }}>Điều khoản dịch vụ</a>{" "}
              và{" "}
              <a href="/privacy" style={{ color: "var(--navy)", fontWeight: 600, textDecoration: "none" }}>Chính sách bảo mật</a>
              {" "}của chúng tôi.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}