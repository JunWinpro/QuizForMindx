import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Settings {
  dailyGoal: number;
  defaultLanguage: string;
  notificationsEnabled: boolean;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Toast({
  msg,
  type,
}: {
  msg: string;
  type: "success" | "error";
}) {
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
        fontWeight: 700,
        fontSize: 14,
        boxShadow: "0 4px 20px rgba(0,0,0,.2)",
        maxWidth: 320,
        animation: "fadeUp .3s ease",
      }}
    >
      {msg}
    </div>
  );
}

function SectionCard({
  icon,
  title,
  desc,
  children,
}: {
  icon: string;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "white",
        border: "1.5px solid var(--border)",
        borderRadius: 20,
        padding: "28px 28px 24px",
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 24 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "var(--cream-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "var(--navy)", marginBottom: 3 }}>
            {title}
          </div>
          {desc && (
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>{desc}</div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "14px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)", marginBottom: 2 }}>
          {label}
        </div>
        {desc && <div style={{ fontSize: 12, color: "var(--muted)" }}>{desc}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        style={{
          width: 48,
          height: 26,
          borderRadius: 13,
          border: "none",
          background: checked ? "var(--emerald)" : "var(--cream-2)",
          cursor: "pointer",
          position: "relative",
          transition: "background .2s",
          flexShrink: 0,
          outline: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 24 : 3,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "white",
            boxShadow: "0 1px 6px rgba(0,0,0,.2)",
            transition: "left .2s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: "en", label: "🇬🇧 Tiếng Anh" },
  { code: "ja", label: "🇯🇵 Tiếng Nhật" },
  { code: "fr", label: "🇫🇷 Tiếng Pháp" },
  { code: "zh", label: "🇨🇳 Tiếng Trung" },
  { code: "de", label: "🇩🇪 Tiếng Đức" },
  { code: "ko", label: "🇰🇷 Tiếng Hàn" },
];

export default function SettingsPage() {
  const { user, login } = useAuth();

  const [settings, setSettings] = useState<Settings>({
    dailyGoal: (user as any)?.settings?.dailyGoal ?? 20,
    defaultLanguage: (user as any)?.settings?.defaultLanguage ?? "en",
    notificationsEnabled: (user as any)?.settings?.notificationsEnabled ?? true,
  });

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true"
  );
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [dirty, setDirty] = useState(false);

  // Sync settings from user when loaded
  useEffect(() => {
    if (user) {
      setSettings({
        dailyGoal: (user as any)?.settings?.dailyGoal ?? 20,
        defaultLanguage: (user as any)?.settings?.defaultLanguage ?? "en",
        notificationsEnabled: (user as any)?.settings?.notificationsEnabled ?? true,
      });
    }
  }, [user]);

  // Apply dark mode
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const updateSetting = <K extends keyof Settings>(key: K, val: Settings[K]) => {
    setSettings((s) => ({ ...s, [key]: val }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put("/auth/settings", settings);
      if (res.data?.success) {
        // Refresh user trong context: /auth/me trả về { success, user }
        const meRes = await api.get("/auth/me");
        if (meRes.data?.success && meRes.data.user) {
          const token = localStorage.getItem("token") ?? "";
          login(token, meRes.data.user);
        }
        setDirty(false);
        showToast("Đã lưu cài đặt! ✅");
      } else {
        showToast(res.data?.message ?? "Lưu thất bại", "error");
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? "Lỗi kết nối", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 80px" }}>
      {toast && <Toast {...toast} />}

      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: 36 }}>
        <h1
          style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 700,
            fontSize: "clamp(26px,4vw,36px)",
            color: "var(--navy)",
            marginBottom: 6,
          }}
        >
          Cài đặt
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 15 }}>
          Tùy chỉnh trải nghiệm học tập của bạn
        </p>
      </div>

      {/* ── Mục tiêu học tập ── */}
      <div className="animate-fade-up stagger-1">
        <SectionCard
          icon="🎯"
          title="Mục tiêu học tập"
          desc="Đặt số từ bạn muốn học mỗi ngày"
        >
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 12,
              }}
            >
              <label
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text)",
                }}
              >
                Số từ mỗi ngày
              </label>
              <div
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontWeight: 700,
                  fontSize: 28,
                  color: "var(--emerald)",
                  lineHeight: 1,
                }}
              >
                {settings.dailyGoal}
              </div>
            </div>
            <input
              type="range"
              min={1}
              max={200}
              value={settings.dailyGoal}
              onChange={(e) => updateSetting("dailyGoal", Number(e.target.value))}
              style={{
                width: "100%",
                height: 6,
                borderRadius: 3,
                appearance: "none",
                WebkitAppearance: "none",
                background: `linear-gradient(to right, var(--emerald) ${((settings.dailyGoal - 1) / 199) * 100}%, var(--cream-2) ${((settings.dailyGoal - 1) / 199) * 100}%)`,
                outline: "none",
                cursor: "pointer",
                marginBottom: 12,
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                color: "var(--muted)",
              }}
            >
              <span>1 từ</span>
              <div style={{ display: "flex", gap: 20 }}>
                {[5, 10, 20, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => updateSetting("dailyGoal", preset)}
                    style={{
                      padding: "3px 10px",
                      borderRadius: 20,
                      border: "1.5px solid var(--border)",
                      background:
                        settings.dailyGoal === preset ? "var(--navy)" : "white",
                      color:
                        settings.dailyGoal === preset ? "white" : "var(--muted)",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'Outfit', sans-serif",
                      transition: "all .15s",
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <span>200 từ</span>
            </div>
            {settings.dailyGoal >= 100 && (
              <div
                style={{
                  marginTop: 12,
                  background: "rgba(245,166,35,.1)",
                  border: "1px solid rgba(245,166,35,.3)",
                  borderRadius: 10,
                  padding: "8px 12px",
                  fontSize: 13,
                  color: "#D4890A",
                }}
              >
                💪 Mục tiêu cao! Hãy đảm bảo bạn có đủ thời gian mỗi ngày.
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* ── Ngôn ngữ ── */}
      <div className="animate-fade-up stagger-2">
        <SectionCard
          icon="🌍"
          title="Ngôn ngữ mặc định"
          desc="Ngôn ngữ bạn đang tập trung học"
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 10,
            }}
          >
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => updateSetting("defaultLanguage", lang.code)}
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: `1.5px solid ${
                    settings.defaultLanguage === lang.code
                      ? "var(--navy)"
                      : "var(--border)"
                  }`,
                  background:
                    settings.defaultLanguage === lang.code
                      ? "var(--navy)"
                      : "white",
                  color:
                    settings.defaultLanguage === lang.code
                      ? "white"
                      : "var(--text)",
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all .2s",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {lang.label}
                {settings.defaultLanguage === lang.code && (
                  <span style={{ marginLeft: "auto", fontSize: 12 }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ── Thông báo + Giao diện ── */}
      <div className="animate-fade-up stagger-3">
        <SectionCard
          icon="🔔"
          title="Thông báo & Giao diện"
          desc="Quản lý cách app nhắc nhở bạn học"
        >
          <div>
            <Toggle
              label="Thông báo nhắc học"
              desc="Nhận nhắc nhở hàng ngày để duy trì streak"
              checked={settings.notificationsEnabled}
              onChange={(v) => updateSetting("notificationsEnabled", v)}
            />
            <Toggle
              label="Chế độ tối"
              desc="Giảm mỏi mắt khi học vào ban đêm"
              checked={darkMode}
              onChange={setDarkMode}
            />
            <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
            <div style={{ paddingTop: 12 }}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8, fontWeight: 500 }}>
                Giao diện màu chủ đạo (sắp ra mắt)
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { color: "#00C896", label: "Xanh ngọc" },
                  { color: "#6C63FF", label: "Tím" },
                  { color: "#FF6B35", label: "Cam" },
                  { color: "#45B7D1", label: "Xanh dương" },
                ].map((theme) => (
                  <button
                    key={theme.color}
                    disabled
                    title={theme.label}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: theme.color,
                      border:
                        theme.color === "#00C896"
                          ? "3px solid var(--navy)"
                          : "3px solid transparent",
                      cursor: "not-allowed",
                      opacity: 0.6,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ── Học tập nâng cao ── */}
      <div className="animate-fade-up stagger-4">
        <SectionCard
          icon="🧠"
          title="Cài đặt học tập"
          desc="Điều chỉnh thuật toán spaced repetition"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                background: "var(--cream)",
                borderRadius: 12,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)", marginBottom: 2 }}>
                  Thuật toán SM-2
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  Tự động lên lịch ôn tập dựa trên hiệu suất
                </div>
              </div>
              <div
                style={{
                  background: "var(--emerald)",
                  color: "white",
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Đang bật
              </div>
            </div>
            <div
              style={{
                background: "var(--cream)",
                borderRadius: 12,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)", marginBottom: 2 }}>
                  Số thẻ mới mỗi ngày
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  Giới hạn thẻ mới trong mục tiêu hàng ngày
                </div>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  fontStyle: "italic",
                }}
              >
                Sắp ra mắt
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Save button */}
      <div
        className="animate-fade-up stagger-5"
        style={{
          position: "sticky",
          bottom: 24,
          display: "flex",
          justifyContent: "flex-end",
          gap: 12,
        }}
      >
        {dirty && (
          <button
            onClick={() => {
              setSettings({
                dailyGoal: (user as any)?.settings?.dailyGoal ?? 20,
                defaultLanguage: (user as any)?.settings?.defaultLanguage ?? "en",
                notificationsEnabled:
                  (user as any)?.settings?.notificationsEnabled ?? true,
              });
              setDirty(false);
            }}
            style={{
              padding: "13px 24px",
              borderRadius: 14,
              border: "1.5px solid var(--border)",
              background: "white",
              color: "var(--muted)",
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 600,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            Hủy
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          style={{
            padding: "13px 36px",
            borderRadius: 14,
            border: "none",
            background: !dirty ? "var(--cream-2)" : saving ? "var(--navy-2)" : "var(--navy)",
            color: !dirty ? "var(--muted)" : "white",
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            fontSize: 15,
            cursor: !dirty || saving ? "not-allowed" : "pointer",
            boxShadow: dirty && !saving ? "0 8px 28px rgba(13,27,42,.2)" : "none",
            transition: "all .2s",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {saving ? (
            <>
              <span
                style={{
                  width: 16,
                  height: 16,
                  border: "2px solid rgba(255,255,255,.4)",
                  borderTopColor: "white",
                  borderRadius: "50%",
                  animation: "spin .7s linear infinite",
                  display: "inline-block",
                }}
              />
              Đang lưu...
            </>
          ) : dirty ? (
            "Lưu cài đặt ✅"
          ) : (
            "Đã lưu"
          )}
        </button>
      </div>
    </div>
  );
}