import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { Link } from "react-router-dom";
import { useSRS } from "../hooks/UseSRS";
import { useNotification, notifyDueCards } from "../utils/useNotification";
import { useAuth } from "../context/AuthContext";

// ── Helpers ────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10);

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  if (dateStr === TODAY) return "Hôm nay";
  return d.toLocaleDateString("vi-VN", { weekday: "short", day: "numeric", month: "numeric" });
}

// ── Custom tooltip for chart ──────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--navy)", color: "white",
      borderRadius: 10, padding: "10px 14px", fontSize: 13,
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div>📇 {payload[0].value} từ cần ôn</div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const { user } = useAuth();
  const srs = useSRS();
  const notification = useNotification();
  const [notifAsked, setNotifAsked] = useState(false);

  // Load data khi mount
  useEffect(() => {
    srs.loadDueCards();
    srs.loadSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nếu đã có quyền notification và có due cards → gửi thông báo 1 lần
  useEffect(() => {
    if (notification.permission === "granted" && srs.dueCount > 0 && !notifAsked) {
      setNotifAsked(true);
      notifyDueCards(srs.dueCount, notification.notify);
    }
  }, [notification.permission, srs.dueCount, notifAsked, notification.notify]);

  // Chart data: highlight hôm nay
  const chartData = srs.schedule.map(d => ({
    ...d,
    label: formatDate(d.date),
    isToday: d.date === TODAY,
  }));

  const maxCount = Math.max(...srs.schedule.map(d => d.count), 1);

  if (!user) {
    return (
      <div style={{ minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 48 }}>🔐</div>
        <h2 style={{ fontFamily: "'Fraunces', serif", color: "var(--navy)" }}>Đăng nhập để xem lịch ôn tập</h2>
        <Link to="/login" style={{ background: "var(--navy)", color: "white", borderRadius: 12, padding: "10px 24px", fontWeight: 700, textDecoration: "none" }}>
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>

      {/* ── Header ── */}
      <div className="animate-fade-up" style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: "clamp(24px,4vw,34px)", color: "var(--navy)", marginBottom: 6 }}>
          📅 Lịch ôn tập
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 15 }}>
          Theo dõi lịch review SRS 7 ngày tới của bạn
        </p>
      </div>

      {/* ── Notification Permission Banner ── */}
      {notification.isSupported && notification.permission === "default" && (
        <div className="animate-fade-up" style={{
          background: "linear-gradient(135deg, rgba(0,200,150,.08), rgba(69,183,209,.08))",
          border: "1.5px solid rgba(0,200,150,.3)",
          borderRadius: 16, padding: "16px 20px", marginBottom: 28,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 16, flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 28 }}>🔔</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--navy)", marginBottom: 2 }}>
                Bật thông báo nhắc ôn từ
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>
                LexiLearn sẽ nhắc bạn khi có từ cần ôn hôm nay
              </div>
            </div>
          </div>
          <button
            onClick={async () => {
              await notification.requestPermission();
              if (notification.permission === "granted" && srs.dueCount > 0) {
                notifyDueCards(srs.dueCount, notification.notify);
              }
            }}
            style={{
              background: "var(--emerald)", color: "var(--navy)",
              border: "none", borderRadius: 10, padding: "9px 20px",
              fontWeight: 700, fontSize: 13, cursor: "pointer",
              fontFamily: "'Outfit', sans-serif", whiteSpace: "nowrap",
            }}
          >
            🔔 Bật thông báo
          </button>
        </div>
      )}

      {notification.permission === "granted" && (
        <div style={{
          background: "rgba(0,200,150,.06)", border: "1px solid rgba(0,200,150,.2)",
          borderRadius: 12, padding: "10px 16px", marginBottom: 20,
          fontSize: 13, color: "var(--emerald)", fontWeight: 600,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          ✅ Thông báo đã được bật – LexiLearn sẽ nhắc bạn mỗi ngày
        </div>
      )}

      {notification.permission === "denied" && (
        <div style={{
          background: "rgba(255,107,107,.06)", border: "1px solid rgba(255,107,107,.2)",
          borderRadius: 12, padding: "10px 16px", marginBottom: 20,
          fontSize: 13, color: "#e05252",
        }}>
          ⚠️ Bạn đã chặn thông báo. Vào Settings trình duyệt để bật lại.
        </div>
      )}

      {/* ── Today Summary ── */}
      <div className="animate-fade-up stagger-1" style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 16, marginBottom: 32,
      }}>
        {[
          {
            icon: "🔴", label: "Cần ôn hôm nay",
            value: srs.dueLoading ? "…" : srs.dueCount,
            color: srs.dueCount > 0 ? "#FF6B6B" : "var(--emerald)",
            bg: srs.dueCount > 0 ? "rgba(255,107,107,.06)" : "rgba(0,200,150,.06)",
          },
          {
            icon: "📅", label: "Tổng 7 ngày tới",
            value: srs.scheduleLoading ? "…" : srs.schedule.reduce((s, d) => s + d.count, 0),
            color: "var(--navy)", bg: "rgba(13,27,42,.04)",
          },
          {
            icon: "📊", label: "Ngày bận nhất",
            value: srs.scheduleLoading ? "…"
              : (() => {
                const peak = srs.schedule.reduce((m, d) => d.count > m.count ? d : m, { date: "", count: 0 });
                return peak.count > 0 ? `${peak.count} từ` : "—";
              })(),
            color: "#F5A623", bg: "rgba(245,166,35,.06)",
          },
        ].map(item => (
          <div key={item.label} style={{
            background: item.bg, border: "1.5px solid var(--border)",
            borderRadius: 16, padding: "18px 20px",
          }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{item.icon}</div>
            <div style={{
              fontFamily: "'Fraunces', serif", fontWeight: 700,
              fontSize: 26, color: item.color as string, lineHeight: 1, marginBottom: 4,
            }}>
              {item.value}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* ── Bar Chart ── */}
      <div className="animate-fade-up stagger-2" style={{
        background: "white", border: "1.5px solid var(--border)",
        borderRadius: 20, padding: "28px 24px", marginBottom: 32,
      }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 18, color: "var(--navy)", marginBottom: 4 }}>
          Phân bố lịch review
        </h2>
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 24 }}>
          Số từ cần ôn theo từng ngày trong 7 ngày tới
        </p>

        {srs.scheduleLoading ? (
          <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
            Đang tải…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barCategoryGap="30%" margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "var(--muted)", fontFamily: "'Outfit', sans-serif" }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted)" }}
                axisLine={false} tickLine={false}
                allowDecimals={false}
                domain={[0, maxCount + 1]}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(13,27,42,.04)" }} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={
                      entry.isToday
                        ? "#FF6B6B"
                        : entry.count === 0
                          ? "var(--cream-2)"
                          : "var(--navy)"
                    }
                    opacity={entry.count === 0 ? 0.4 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Legend */}
        <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)" }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: "#FF6B6B" }} />
            Hôm nay
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)" }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: "var(--navy)" }} />
            Các ngày tới
          </div>
        </div>
      </div>

      {/* ── Due Cards Today ── */}
      <div className="animate-fade-up stagger-3">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 18, color: "var(--navy)" }}>
            📋 Từ cần ôn hôm nay
            {srs.dueCount > 0 && (
              <span style={{
                marginLeft: 10, display: "inline-flex", alignItems: "center", justifyContent: "center",
                minWidth: 24, height: 24, borderRadius: 99, padding: "0 7px",
                background: "#FF6B6B", color: "white", fontSize: 12, fontWeight: 700,
              }}>
                {srs.dueCount}
              </span>
            )}
          </h2>
          {srs.dueCount > 0 && (
            <Link
              to={`/decks`}
              style={{
                background: "var(--navy)", color: "white",
                borderRadius: 10, padding: "8px 18px", fontSize: 13,
                fontWeight: 700, textDecoration: "none",
              }}
            >
              Ôn ngay →
            </Link>
          )}
        </div>

        {srs.dueLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: 64, borderRadius: 12 }} />
            ))}
          </div>
        ) : srs.dueCards.length === 0 ? (
          <div style={{
            background: "rgba(0,200,150,.06)", border: "1.5px solid rgba(0,200,150,.2)",
            borderRadius: 16, padding: "32px 24px", textAlign: "center",
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--navy)", marginBottom: 6 }}>
              Không có từ nào cần ôn hôm nay!
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              Tiếp tục học để tích lũy thêm từ vựng
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {srs.dueCards.slice(0, 20).map((card, i) => (
              <div
                key={card._id}
                className={`animate-fade-up stagger-${Math.min(i + 1, 6)}`}
                style={{
                  background: "white", border: "1.5px solid var(--border)",
                  borderRadius: 12, padding: "14px 18px",
                  display: "flex", alignItems: "center", gap: 14,
                }}
              >
                {/* Interval badge */}
                <div style={{
                  minWidth: 40, height: 40, borderRadius: 10,
                  background: card._srsInterval <= 1 ? "rgba(255,107,107,.1)" : "rgba(0,200,150,.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexDirection: "column",
                }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700,
                    color: card._srsInterval <= 1 ? "#e05252" : "var(--emerald)",
                    lineHeight: 1,
                  }}>
                    {card._srsInterval}d
                  </div>
                </div>

                {/* Word */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--navy)", marginBottom: 2 }}>
                    {card.front}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {card.back}
                    {card.phonetic && (
                      <span style={{ marginLeft: 8, opacity: 0.6, fontStyle: "italic" }}>
                        {card.phonetic}
                      </span>
                    )}
                  </div>
                </div>

                {/* Overdue indicator */}
                {new Date(card._nextReview) < new Date(TODAY) && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: "#e05252",
                    background: "rgba(255,107,107,.1)", borderRadius: 6,
                    padding: "2px 6px", whiteSpace: "nowrap",
                  }}>
                    Quá hạn
                  </span>
                )}
              </div>
            ))}

            {srs.dueCards.length > 20 && (
              <div style={{ textAlign: "center", fontSize: 13, color: "var(--muted)", padding: 12 }}>
                … và {srs.dueCards.length - 20} từ nữa
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CTA ── */}
      {srs.dueCount > 0 && (
        <div style={{ marginTop: 32, textAlign: "center" }}>
          <Link
            to="/decks"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "var(--navy)", color: "white",
              borderRadius: 14, padding: "13px 32px",
              fontSize: 15, fontWeight: 700, textDecoration: "none",
              boxShadow: "0 8px 24px rgba(13,27,42,.18)",
            }}
          >
            🎯 Chọn deck để ôn ngay
          </Link>
        </div>
      )}
    </div>
  );
}