import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

interface HistoryItem {
  _id: string;
  deckId: string;
  deckName: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  duration: number;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m${s}s` : `${m}m`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Hôm nay " + d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function ScoreBadge({ score }: { score: number }) {
  const color  = score >= 80 ? "#00a87f"  : score >= 50 ? "#D4890A"  : "#c0392b";
  const bg     = score >= 80 ? "rgba(0,200,150,.1)" : score >= 50 ? "rgba(245,166,35,.1)" : "rgba(255,107,107,.1)";
  const border = score >= 80 ? "rgba(0,200,150,.25)" : score >= 50 ? "rgba(245,166,35,.25)" : "rgba(255,107,107,.25)";
  const emoji  = score >= 80 ? "🏆" : score >= 50 ? "💪" : "📚";
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 12px",
      borderRadius: 20,
      background: bg,
      border: `1.5px solid ${border}`,
      fontSize: 13,
      fontWeight: 800,
      color,
      fontFamily: "'Fraunces', serif",
    }}>
      <span style={{ fontSize: 12 }}>{emoji}</span>
      {score}%
    </div>
  );
}

export default function QuizHistoryPage() {
  const [history, setHistory]     = useState<HistoryItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);

  const load = async (p: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/quiz/history?page=${p}&limit=10`);
      if (res.data?.success) {
        setHistory(res.data.data ?? []);
        setPagination(res.data.pagination ?? null);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page); }, [page]);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px 80px" }}>
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: 36 }}>
        <Link
          to="/quiz"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "var(--muted)",
            textDecoration: "none",
            fontWeight: 500,
            marginBottom: 16,
          }}
        >
          ← Quiz Mode
        </Link>
        <h1 style={{
          fontFamily: "'Fraunces', serif",
          fontWeight: 700,
          fontSize: "clamp(24px, 4vw, 34px)",
          color: "var(--navy)",
          marginBottom: 8,
          letterSpacing: "-0.5px",
        }}>
          Lịch sử Quiz
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 15 }}>
          {pagination ? `${pagination.total} lần làm bài` : "Theo dõi tiến trình của bạn"}
        </p>
      </div>

      {/* Summary mini-stats */}
      {!loading && history.length > 0 && (
        <div className="animate-fade-up stagger-1" style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 28,
        }}>
          {(() => {
            const avg = Math.round(history.reduce((s, h) => s + h.score, 0) / history.length);
            const best = Math.max(...history.map(h => h.score));
            return [
              { icon: "📊", label: "TB trang này", value: `${avg}%` },
              { icon: "🏆", label: "Cao nhất",     value: `${best}%` },
              { icon: "📝", label: "Tổng lần thi", value: pagination?.total ?? history.length },
            ];
          })().map(stat => (
            <div key={stat.label} style={{
              background: "white",
              border: "1.5px solid var(--border)",
              borderRadius: 16,
              padding: "16px 12px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{stat.icon}</div>
              <div style={{
                fontFamily: "'Fraunces', serif",
                fontWeight: 700,
                fontSize: 24,
                color: "var(--navy)",
                lineHeight: 1,
                marginBottom: 4,
              }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, letterSpacing: "0.04em" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History list */}
      <div className="animate-fade-up stagger-2">
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ borderRadius: 16, height: 80 }} />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "80px 24px",
            background: "white",
            border: "1.5px solid var(--border)",
            borderRadius: 20,
          }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>📋</div>
            <div style={{
              fontFamily: "'Fraunces', serif",
              fontWeight: 700,
              fontSize: 20,
              color: "var(--navy)",
              marginBottom: 8,
            }}>
              Chưa có lịch sử quiz
            </div>
            <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>
              Hãy làm bài quiz đầu tiên của bạn!
            </div>
            <Link
              to="/quiz"
              style={{
                background: "var(--navy)",
                color: "white",
                padding: "11px 28px",
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              🎯 Bắt đầu Quiz
            </Link>
          </div>
        ) : (
          <div style={{
            background: "white",
            border: "1.5px solid var(--border)",
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(13,27,42,.04)",
          }}>
            {history.map((item, i) => (
              <Link
                key={item._id}
                to={`/quiz/result/${item._id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "16px 20px",
                  textDecoration: "none",
                  borderTop: i > 0 ? "1px solid var(--border)" : "none",
                  transition: "background .15s",
                  background: "white",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = "var(--cream)"}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = "white"}
              >
                {/* Score badge */}
                <div style={{ flexShrink: 0 }}>
                  <ScoreBadge score={item.score} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: "var(--navy)",
                    marginBottom: 3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {item.deckName}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: "var(--muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                  }}>
                    <span>✅ {item.correctCount}/{item.totalQuestions} câu đúng</span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span>⏱ {formatDuration(item.duration)}</span>
                  </div>
                </div>

                {/* Date + arrow */}
                <div style={{
                  flexShrink: 0,
                  textAlign: "right",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 4,
                }}>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    {formatDate(item.createdAt)}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: "var(--muted)",
                    opacity: 0.5,
                  }}>→</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="animate-fade-up stagger-3" style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
          marginTop: 24,
        }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              border: "1.5px solid var(--border)",
              background: "white",
              cursor: page === 1 ? "not-allowed" : "pointer",
              opacity: page === 1 ? 0.4 : 1,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--navy)",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            ← Trước
          </button>

          <div style={{ display: "flex", gap: 6 }}>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, pagination.totalPages - 4)) + i;
              if (p > pagination.totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: "1.5px solid var(--border)",
                    background: p === page ? "var(--navy)" : "white",
                    color: p === page ? "white" : "var(--navy)",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              border: "1.5px solid var(--border)",
              background: "white",
              cursor: page === pagination.totalPages ? "not-allowed" : "pointer",
              opacity: page === pagination.totalPages ? 0.4 : 1,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--navy)",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  );
}