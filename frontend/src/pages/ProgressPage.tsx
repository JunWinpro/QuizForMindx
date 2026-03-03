import { useEffect, useState } from "react";

interface StatCardProps {
  icon: string;
  value: string;
  label: string;
  color?: string;
}

function StatCard({ icon, value, label, color = "var(--emerald)" }: StatCardProps) {
  return (
    <div style={{
      background: "white", border: "1.5px solid var(--border)",
      borderRadius: 16, padding: "20px 24px", textAlign: "center",
    }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 30, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

interface ActivityDay {
  date: string;
  day: string;
  count: number;
  xp: number;
}

interface DeckProgress {
  name: string;
  language: string;
  total: number;
  learned: number;
  color: string;
}

const FLAG: Record<string, string> = { en: "🇬🇧", ja: "🇯🇵", fr: "🇫🇷", zh: "🇨🇳", de: "🇩🇪" };

export default function ProgressPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "decks" | "history">("overview");
  const [animReady, setAnimReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  const weekDays: ActivityDay[] = [
    { date: "24/2", day: "T2", count: 24, xp: 120 },
    { date: "25/2", day: "T3", count: 0,  xp: 0   },
    { date: "26/2", day: "T4", count: 31, xp: 155 },
    { date: "27/2", day: "T5", count: 18, xp: 90  },
    { date: "28/2", day: "T6", count: 35, xp: 175 },
    { date: "1/3",  day: "T7", count: 42, xp: 210 },
    { date: "2/3",  day: "CN", count: 28, xp: 140 },
  ];

  const monthHeatmap = Array.from({ length: 28 }, (_, i) => ({
    day: i + 1,
    count: Math.random() > 0.3 ? Math.floor(Math.random() * 40) : 0,
  }));

  const deckProgresses: DeckProgress[] = [
    { name: "IELTS Academic Vocabulary", language: "en", total: 120, learned: 84,  color: "#00C896" },
    { name: "日本語 N3 必須語彙",           language: "ja", total: 85,  learned: 41,  color: "#F5A623" },
    { name: "Tiếng Pháp Giao tiếp",       language: "fr", total: 60,  learned: 60,  color: "#6C63FF" },
    { name: "Business English",            language: "en", total: 200, learned: 32,  color: "#FF6B6B" },
    { name: "Hán tự thông dụng HSK 4",    language: "zh", total: 150, learned: 105, color: "#4ECDC4" },
  ];

  const history = [
    { date: "Hôm nay",    deck: "IELTS Academic",  cards: 20, accuracy: 90, xp: 100, duration: "12 phút" },
    { date: "Hôm nay",    deck: "Business English", cards: 15, accuracy: 80, xp: 75,  duration: "9 phút"  },
    { date: "Hôm qua",    deck: "日本語 N3",          cards: 30, accuracy: 73, xp: 110, duration: "18 phút" },
    { date: "Hôm qua",    deck: "IELTS Academic",   cards: 25, accuracy: 88, xp: 125, duration: "15 phút" },
    { date: "2 ngày trước", deck: "HSK 4",           cards: 40, accuracy: 95, xp: 200, duration: "22 phút" },
  ];

  const maxBar = Math.max(...weekDays.map(d => d.count));

  const tabs: { id: "overview" | "decks" | "history"; label: string; icon: string }[] = [
    { id: "overview", label: "Tổng quan",  icon: "📊" },
    { id: "decks",    label: "Bộ thẻ",    icon: "📚" },
    { id: "history",  label: "Lịch sử",   icon: "📋" },
  ];

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>

      {/* ── Page header ── */}
      <div className="animate-fade-up" style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: "clamp(26px,4vw,36px)", color: "var(--navy)", marginBottom: 6 }}>
              Tiến trình của bạn
            </h1>
            <p style={{ color: "var(--muted)", fontSize: 15 }}>Theo dõi hành trình học ngôn ngữ của bạn</p>
          </div>
          {/* Streak badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "linear-gradient(135deg, #FF6B35, #F5A623)",
            borderRadius: 16, padding: "12px 20px",
            boxShadow: "0 4px 20px rgba(245,166,35,.3)",
          }}>
            <span style={{ fontSize: 28 }}>🔥</span>
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 26, color: "white", lineHeight: 1 }}>12</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.85)", fontWeight: 600, letterSpacing: "0.04em" }}>NGÀY STREAK</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="animate-fade-up stagger-1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 16, marginBottom: 32 }}>
        <StatCard icon="✅" value="342"  label="Từ đã học"       color="var(--emerald)"  />
        <StatCard icon="🎯" value="87%"  label="Độ chính xác"    color="#6C63FF"         />
        <StatCard icon="⏱️" value="4.2h" label="Tổng giờ học"    color="#F5A623"         />
        <StatCard icon="📚" value="5"    label="Deck đang học"   color="#45B7D1"         />
        <StatCard icon="⭐" value="1,750" label="Tổng XP"        color="#FF6B35"         />
      </div>

      {/* ── Tabs ── */}
      <div className="animate-fade-up stagger-2" style={{ display: "flex", gap: 6, marginBottom: 28, background: "white", border: "1.5px solid var(--border)", borderRadius: 14, padding: 6 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "10px 16px", borderRadius: 10, border: "none", cursor: "pointer",
            fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 14,
            background: activeTab === tab.id ? "var(--navy)" : "transparent",
            color:      activeTab === tab.id ? "white"       : "var(--muted)",
            transition: "all .2s",
          }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Overview ── */}
      {activeTab === "overview" && (
        <div className="animate-fade-in">
          {/* Weekly chart */}
          <div style={{ background: "white", border: "1.5px solid var(--border)", borderRadius: 20, padding: 28, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ fontWeight: 700, fontSize: 16, color: "var(--navy)" }}>Hoạt động 7 ngày qua</h3>
              <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>178 cards · 890 XP</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 120 }}>
              {weekDays.map((d, i) => (
                <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  {d.count > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--emerald)" }}>{d.count}</span>
                  )}
                  <div style={{
                    width: "100%", borderRadius: 8,
                    height: animReady ? `${Math.max((d.count / maxBar) * 90, d.count > 0 ? 8 : 4)}px` : "4px",
                    background: d.count > 0
                      ? `linear-gradient(180deg, var(--emerald), var(--emerald-d))`
                      : "var(--cream-2)",
                    transition: `height .6s cubic-bezier(.4,0,.2,1) ${i * 0.05}s`,
                    position: "relative",
                  }}/>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: d.count > 0 ? "var(--navy)" : "var(--muted)" }}>{d.day}</div>
                    <div style={{ fontSize: 10, color: "var(--muted)" }}>{d.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly heatmap */}
          <div style={{ background: "white", border: "1.5px solid var(--border)", borderRadius: 20, padding: 28, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: 16, color: "var(--navy)" }}>Tháng 2 — 2026</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--muted)" }}>
                <span>Ít</span>
                {[0.15, 0.35, 0.6, 0.85, 1].map(o => (
                  <div key={o} style={{ width: 14, height: 14, borderRadius: 3, background: `rgba(0,200,150,${o})` }}/>
                ))}
                <span>Nhiều</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
              {monthHeatmap.map(({ day, count }) => (
                <div key={day} title={`${day}/2: ${count} thẻ`} style={{
                  aspectRatio: "1", borderRadius: 4,
                  background: count === 0 ? "var(--cream-2)" : `rgba(0,200,150,${Math.min(count / 40 + 0.15, 1)})`,
                  transition: "transform .15s",
                  cursor: "default",
                }}/>
              ))}
            </div>
          </div>

          {/* XP level bar */}
          <div style={{ background: "linear-gradient(135deg, var(--navy), var(--navy-2))", borderRadius: 20, padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.6)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Cấp độ hiện tại</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 24, color: "white" }}>🥈 Cấp 6 — Silver Scholar</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 22, color: "var(--emerald)" }}>1,750</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)", fontWeight: 500 }}>/ 2,000 XP</div>
              </div>
            </div>
            <div style={{ height: 8, background: "rgba(255,255,255,.1)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 4,
                background: "linear-gradient(90deg, var(--emerald), var(--gold))",
                width: animReady ? "87.5%" : "0%",
                transition: "width .8s cubic-bezier(.4,0,.2,1) .3s",
              }}/>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "rgba(255,255,255,.5)" }}>
              <span>Silver Scholar</span>
              <span>250 XP nữa → Gold Master 🥇</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Decks ── */}
      {activeTab === "decks" && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {deckProgresses.map((deck, i) => {
            const pct = Math.round((deck.learned / deck.total) * 100);
            return (
              <div key={i} style={{ background: "white", border: "1.5px solid var(--border)", borderRadius: 18, padding: "20px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 24 }}>{FLAG[deck.language] || "🌐"}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "var(--navy)" }}>{deck.name}</div>
                      <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
                        {deck.learned} / {deck.total} thẻ đã học
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 20,
                    color: pct === 100 ? "var(--emerald)" : "var(--navy)",
                  }}>
                    {pct}%
                    {pct === 100 && <span style={{ fontSize: 16, marginLeft: 4 }}>✅</span>}
                  </div>
                </div>
                <div style={{ height: 6, background: "var(--cream-2)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 3,
                    background: `linear-gradient(90deg, ${deck.color}, ${deck.color}aa)`,
                    width: animReady ? `${pct}%` : "0%",
                    transition: `width .7s cubic-bezier(.4,0,.2,1) ${i * 0.08}s`,
                  }}/>
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                  {pct === 100
                    ? <span style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 600 }}>🎉 Hoàn thành!</span>
                    : <span style={{ fontSize: 13, color: "var(--muted)" }}>Còn {deck.total - deck.learned} thẻ chưa học</span>
                  }
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB: History ── */}
      {activeTab === "history" && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {history.map((item, i) => (
            <div key={i} style={{ background: "white", border: "1.5px solid var(--border)", borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: "0 0 auto" }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--cream-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📖</div>
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--navy)", marginBottom: 3 }}>{item.deck}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{item.date} · {item.duration}</div>
              </div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 18, color: "var(--navy)" }}>{item.cards}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>thẻ</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 18, color: item.accuracy >= 85 ? "var(--emerald)" : item.accuracy >= 70 ? "#F5A623" : "#FF6B6B" }}>
                    {item.accuracy}%
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>chính xác</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 18, color: "#F5A623" }}>+{item.xp}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>XP</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}