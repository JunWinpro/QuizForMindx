import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProgressStats {
  totalWordsLearned: number;
  averageAccuracy: number;
  totalQuizzes: number;
  currentStreak: number;
  longestStreak: number;
}

interface ActivityDay {
  date: string;       // "2026-03-01"
  quizCount: number;
  avgScore: number;
  cardsReviewed: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function getDayLabel(iso: string) {
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return days[new Date(iso).getDay()];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SkeletonBox({ w = "100%", h = 80, r = 16 }: { w?: string | number; h?: number; r?: number }) {
  return (
    <div
      className="skeleton"
      style={{ width: w, height: h, borderRadius: r }}
    />
  );
}

function StatCard({
  icon,
  value,
  label,
  sub,
  color = "var(--emerald)",
  delay = 0,
}: {
  icon: string;
  value: string | number;
  label: string;
  sub?: string;
  color?: string;
  delay?: number;
}) {
  return (
    <div
      className="animate-fade-up"
      style={{
        animationDelay: `${delay}ms`,
        background: "white",
        border: "1.5px solid var(--border)",
        borderRadius: 20,
        padding: "24px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        position: "relative",
        overflow: "hidden",
        transition: "box-shadow .25s, transform .25s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 12px 40px rgba(13,27,42,.1)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: color,
          opacity: 0.7,
          borderRadius: "20px 20px 0 0",
        }}
      />
      <div style={{ fontSize: 26 }}>{icon}</div>
      <div>
        <div
          style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 700,
            fontSize: 32,
            color,
            lineHeight: 1,
            letterSpacing: "-0.5px",
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--muted)",
            fontWeight: 500,
            marginTop: 5,
          }}
        >
          {label}
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3, opacity: 0.7 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

// Streak flame badge with milestone alerts
function StreakBadge({ streak, longest }: { streak: number; longest: number }) {
  const milestones = [7, 30, 100];
  const nextMilestone = milestones.find((m) => m > streak);
  const hitMilestone = milestones.find((m) => m === streak);
  const progress = nextMilestone
    ? Math.round(((streak % nextMilestone) / nextMilestone) * 100)
    : 100;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #FF6B35 0%, #F5A623 100%)",
        borderRadius: 20,
        padding: "20px 24px",
        boxShadow: "0 8px 32px rgba(245,166,35,.35)",
        position: "relative",
        overflow: "hidden",
        flex: "0 0 auto",
        minWidth: 200,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          fontSize: 80,
          opacity: 0.12,
          userSelect: "none",
        }}
      >
        🔥
      </div>
      {hitMilestone && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 12,
            fontSize: 12,
            fontWeight: 700,
            background: "rgba(255,255,255,.25)",
            borderRadius: 20,
            padding: "2px 10px",
            color: "white",
            letterSpacing: "0.04em",
          }}
        >
          🎉 Milestone!
        </div>
      )}
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "rgba(255,255,255,.75)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        Streak hiện tại
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 12 }}>
        <span
          style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 900,
            fontSize: 48,
            color: "white",
            lineHeight: 1,
          }}
        >
          {streak}
        </span>
        <span style={{ fontSize: 16, color: "rgba(255,255,255,.8)", fontWeight: 600 }}>
          ngày 🔥
        </span>
      </div>
      {nextMilestone && (
        <>
          <div
            style={{
              height: 4,
              background: "rgba(255,255,255,.25)",
              borderRadius: 2,
              overflow: "hidden",
              marginBottom: 6,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "white",
                borderRadius: 2,
                transition: "width .8s ease",
              }}
            />
          </div>
          <div
            style={{ fontSize: 11, color: "rgba(255,255,255,.7)", fontWeight: 500 }}
          >
            Còn {nextMilestone - streak} ngày đến mốc {nextMilestone} ngày
          </div>
        </>
      )}
      {!nextMilestone && (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.8)", fontWeight: 600 }}>
          🏆 Kỷ lục cá nhân: {longest} ngày
        </div>
      )}
    </div>
  );
}

// Circle progress for daily goal
function DailyGoalProgress({
  done,
  goal,
}: {
  done: number;
  goal: number;
}) {
  const pct = Math.min(1, done / goal);
  const r = 38;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        background: "white",
        border: "1.5px solid var(--border)",
        borderRadius: 20,
        padding: "20px 24px",
        flex: 1,
      }}
    >
      <div style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
        <svg width={96} height={96} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={48}
            cy={48}
            r={r}
            fill="none"
            stroke="var(--cream-2)"
            strokeWidth={8}
          />
          <circle
            cx={48}
            cy={48}
            r={r}
            fill="none"
            stroke={pct >= 1 ? "var(--emerald)" : "var(--gold)"}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)" }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: "'Fraunces', serif",
              fontWeight: 700,
              fontSize: 20,
              color: "var(--navy)",
              lineHeight: 1,
            }}
          >
            {Math.round(pct * 100)}%
          </span>
        </div>
      </div>
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--muted)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          Mục tiêu hôm nay
        </div>
        <div
          style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 700,
            fontSize: 26,
            color: "var(--navy)",
            lineHeight: 1,
            marginBottom: 4,
          }}
        >
          {done}
          <span
            style={{
              fontSize: 14,
              color: "var(--muted)",
              fontWeight: 500,
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            /{goal} từ
          </span>
        </div>
        {pct >= 1 ? (
          <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 700 }}>
            🎉 Hoàn thành mục tiêu!
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            Còn {goal - done} từ nữa
          </div>
        )}
      </div>
    </div>
  );
}

// Custom tooltip for recharts
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--navy)",
        border: "none",
        borderRadius: 10,
        padding: "10px 14px",
        boxShadow: "0 8px 24px rgba(13,27,42,.25)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,.6)",
          fontWeight: 600,
          marginBottom: 6,
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </div>
      {payload.map((p: any) => (
        <div
          key={p.dataKey}
          style={{
            fontSize: 13,
            color: p.color,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: p.color,
            }}
          />
          {p.value}
          {p.dataKey === "avgScore" ? "%" : " từ"}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProgressPage() {
  const { user } = useAuth();
  const dailyGoal = (user as any)?.settings?.dailyGoal ?? 20;

  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [activity, setActivity] = useState<ActivityDay[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "charts">("overview");

  // ── Fetch stats + activity in parallel ──────────────────────────────────
  const loadData = useCallback(() => {
    setLoadingStats(true);
    setLoadingActivity(true);

    api
      .get("/stats/progress")
      .then((res) => {
        if (res.data?.success) setStats(res.data.data);
      })
      .catch(() => {})
      .finally(() => setLoadingStats(false));

    api
      .get("/stats/activity")
      .then((res) => {
        if (res.data?.success) setActivity(res.data.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoadingActivity(false));
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  // ── Derived chart data ───────────────────────────────────────────────────
  const chartData = activity.map((d) => ({
    label: getDayLabel(d.date),
    date: formatDate(d.date),
    cardsReviewed: d.cardsReviewed,
    avgScore: d.avgScore,
    quizCount: d.quizCount,
  }));

  const todayCards = activity.find((d) => {
    const today = new Date().toISOString().slice(0, 10);
    return d.date === today;
  })?.cardsReviewed ?? 0;

  const tabs = [
    { id: "overview" as const, label: "Tổng quan", icon: "📊" },
    { id: "charts"   as const, label: "Biểu đồ",   icon: "📈" },
  ];

  const isLoading = loadingStats && loadingActivity;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px 80px" }}>

      {/* ── Header ── */}
      <div className="animate-fade-up" style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 700,
            fontSize: "clamp(26px,4vw,38px)",
            color: "var(--navy)",
            marginBottom: 6,
          }}
        >
          Tiến trình của bạn
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 15 }}>
          Theo dõi hành trình học ngôn ngữ mỗi ngày
        </p>
      </div>

      {/* ── Streak + Daily Goal row ── */}
      <div
        className="animate-fade-up stagger-1"
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 28,
          flexWrap: "wrap",
        }}
      >
        {isLoading ? (
          <>
            <SkeletonBox w={220} h={140} />
            <SkeletonBox h={140} />
          </>
        ) : (
          <>
            <StreakBadge
              streak={stats?.currentStreak ?? 0}
              longest={stats?.longestStreak ?? 0}
            />
            <DailyGoalProgress done={todayCards} goal={dailyGoal} />
          </>
        )}
      </div>

      {/* ── 4 Stat Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBox key={i} h={130} />
          ))
        ) : (
          <>
            <StatCard
              icon="📚"
              value={(stats?.totalWordsLearned ?? 0).toLocaleString()}
              label="Tổng từ đã học"
              sub="qua mọi bộ thẻ"
              color="var(--emerald)"
              delay={0}
            />
            <StatCard
              icon="🎯"
              value={`${stats?.averageAccuracy ?? 0}%`}
              label="Độ chính xác TB"
              sub="trên tất cả quiz"
              color="#6C63FF"
              delay={60}
            />
            <StatCard
              icon="🏆"
              value={stats?.longestStreak ?? 0}
              label="Streak dài nhất"
              sub={`Hiện tại: ${stats?.currentStreak ?? 0} ngày`}
              color="#F5A623"
              delay={120}
            />
            <StatCard
              icon="📝"
              value={stats?.totalQuizzes ?? 0}
              label="Số quiz đã làm"
              sub="từ khi tham gia"
              color="#45B7D1"
              delay={180}
            />
          </>
        )}
      </div>

      {/* ── Tabs ── */}
      <div
        className="animate-fade-up stagger-2"
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 24,
          background: "white",
          border: "1.5px solid var(--border)",
          borderRadius: 14,
          padding: 5,
          width: "fit-content",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "10px 22px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 600,
              fontSize: 14,
              background: activeTab === tab.id ? "var(--navy)" : "transparent",
              color: activeTab === tab.id ? "white" : "var(--muted)",
              transition: "all .2s",
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Overview ── */}
      {activeTab === "overview" && (
        <div className="animate-fade-up">

          {/* 7-day bar chart (manual, animated) */}
          <div
            style={{
              background: "white",
              border: "1.5px solid var(--border)",
              borderRadius: 20,
              padding: 28,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 28,
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <h3
                style={{
                  fontWeight: 700,
                  fontSize: 16,
                  color: "var(--navy)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                📅 Hoạt động 7 ngày qua
              </h3>
              {!loadingActivity && activity.length > 0 && (
                <span
                  style={{
                    fontSize: 13,
                    color: "var(--muted)",
                    fontWeight: 500,
                    background: "var(--cream-2)",
                    borderRadius: 20,
                    padding: "4px 12px",
                  }}
                >
                  {activity.reduce((s, d) => s + d.cardsReviewed, 0)} từ · {activity.reduce((s, d) => s + d.quizCount, 0)} quiz
                </span>
              )}
            </div>

            {loadingActivity ? (
              <SkeletonBox h={140} r={12} />
            ) : chartData.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 24px",
                  color: "var(--muted)",
                  fontSize: 14,
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                Chưa có dữ liệu hoạt động. Hãy học vài từ để bắt đầu!
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 10,
                  height: 130,
                }}
              >
                {(() => {
                  const max = Math.max(...chartData.map((d) => d.cardsReviewed), 1);
                  return chartData.map((d, i) => (
                    <div
                      key={d.label + i}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {d.cardsReviewed > 0 && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "var(--emerald)",
                          }}
                        >
                          {d.cardsReviewed}
                        </span>
                      )}
                      <div
                        style={{
                          width: "100%",
                          borderRadius: 6,
                          background:
                            d.cardsReviewed > 0
                              ? "linear-gradient(180deg,var(--emerald),var(--emerald-d))"
                              : "var(--cream-2)",
                          height: `${Math.max(
                            (d.cardsReviewed / max) * 90,
                            d.cardsReviewed > 0 ? 10 : 5
                          )}px`,
                          transition: `height .6s cubic-bezier(.4,0,.2,1) ${i * 50}ms`,
                        }}
                      />
                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color:
                              d.cardsReviewed > 0
                                ? "var(--navy)"
                                : "var(--muted)",
                          }}
                        >
                          {d.label}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--muted)" }}>
                          {d.date}
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>

          {/* XP level / milestone card */}
          <div
            style={{
              background: "linear-gradient(135deg, var(--navy), var(--navy-2))",
              borderRadius: 20,
              padding: 28,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "rgba(255,255,255,.5)",
                    letterSpacing: "0.09em",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Mốc tiếp theo
                </div>
                <div
                  style={{
                    fontFamily: "'Fraunces', serif",
                    fontWeight: 700,
                    fontSize: 22,
                    color: "white",
                  }}
                >
                  🔥 Streak {(() => {
                    const cur = stats?.currentStreak ?? 0;
                    const next = [7, 30, 100].find((m) => m > cur) ?? cur + 1;
                    return next;
                  })()} ngày
                </div>
              </div>
              <Link
                to="/schedule"
                style={{
                  background: "var(--emerald)",
                  color: "var(--navy)",
                  padding: "11px 24px",
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                Ôn tập ngay 🚀
              </Link>
            </div>
            <div
              style={{
                height: 6,
                background: "rgba(255,255,255,.1)",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg, var(--emerald), var(--gold))",
                  borderRadius: 3,
                  width: (() => {
                    const cur = stats?.currentStreak ?? 0;
                    const milestones = [7, 30, 100];
                    const next = milestones.find((m) => m > cur);
                    if (!next) return "100%";
                    const prev = milestones[milestones.indexOf(next) - 1] ?? 0;
                    return `${Math.round(((cur - prev) / (next - prev)) * 100)}%`;
                  })(),
                  transition: "width .8s ease",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Charts ── */}
      {activeTab === "charts" && (
        <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Line chart: cards reviewed */}
          <div
            style={{
              background: "white",
              border: "1.5px solid var(--border)",
              borderRadius: 20,
              padding: 28,
            }}
          >
            <h3
              style={{
                fontWeight: 700,
                fontSize: 16,
                color: "var(--navy)",
                marginBottom: 24,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              📈 Từ ôn tập mỗi ngày
            </h3>
            {loadingActivity ? (
              <SkeletonBox h={200} r={12} />
            ) : chartData.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 0",
                  color: "var(--muted)",
                  fontSize: 14,
                }}
              >
                Chưa có dữ liệu
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="var(--cream-2)" strokeDasharray="4 4" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: "var(--muted)", fontFamily: "'Outfit',sans-serif" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "var(--muted)", fontFamily: "'Outfit',sans-serif" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="cardsReviewed"
                    stroke="var(--emerald)"
                    strokeWidth={2.5}
                    dot={{ fill: "var(--emerald)", r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Bar chart: accuracy per day */}
          <div
            style={{
              background: "white",
              border: "1.5px solid var(--border)",
              borderRadius: 20,
              padding: 28,
            }}
          >
            <h3
              style={{
                fontWeight: 700,
                fontSize: 16,
                color: "var(--navy)",
                marginBottom: 24,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              🎯 Độ chính xác quiz theo ngày
            </h3>
            {loadingActivity ? (
              <SkeletonBox h={200} r={12} />
            ) : chartData.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 0",
                  color: "var(--muted)",
                  fontSize: 14,
                }}
              >
                Chưa có dữ liệu
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="var(--cream-2)" strokeDasharray="4 4" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: "var(--muted)", fontFamily: "'Outfit',sans-serif" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: "var(--muted)", fontFamily: "'Outfit',sans-serif" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="avgScore"
                    fill="#6C63FF"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Accuracy legend */}
          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            {[
              { label: "Xuất sắc", range: "≥ 85%", color: "var(--emerald)" },
              { label: "Khá tốt",  range: "70–84%", color: "var(--gold)"   },
              { label: "Cần cải thiện", range: "< 70%", color: "#FF6B6B"   },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  color: "var(--muted)",
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: item.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontWeight: 600, color: "var(--text)" }}>
                  {item.label}
                </span>
                {item.range}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick links ── */}
      <div
        className="animate-fade-up"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
          marginTop: 32,
        }}
      >
        {[
          { to: "/schedule",   icon: "📅", label: "Lịch ôn tập", desc: "Xem từ cần ôn hôm nay" },
          { to: "/quiz",       icon: "🎯", label: "Làm quiz",    desc: "Kiểm tra kiến thức" },
          { to: "/quiz/history", icon: "📋", label: "Lịch sử quiz", desc: "Xem lại kết quả" },
          { to: "/settings",   icon: "⚙️", label: "Cài đặt",     desc: "Điều chỉnh mục tiêu" },
        ].map((link) => (
          <Link
            key={link.to}
            to={link.to}
            style={{
              background: "white",
              border: "1.5px solid var(--border)",
              borderRadius: 16,
              padding: "16px 20px",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 14,
              transition: "all .2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--emerald)";
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "var(--cream-2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              {link.icon}
            </div>
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: "var(--navy)",
                  marginBottom: 2,
                }}
              >
                {link.label}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{link.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}