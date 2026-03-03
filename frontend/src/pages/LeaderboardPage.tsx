import { useState } from "react";

interface Leader {
  rank: number;
  name: string;
  avatar: string;
  xp: number;
  streak: number;
  accuracy: number;
  badge: string;
  isMe?: boolean;
}

type Period = "week" | "month" | "alltime";

const WEEKLY_DATA: Leader[] = [
  { rank: 1,  name: "Minh Châu",    avatar: "👩‍💻", xp: 2840, streak: 30, accuracy: 94, badge: "🥇" },
  { rank: 2,  name: "Anh Tuấn",     avatar: "👨‍🎓", xp: 2650, streak: 25, accuracy: 91, badge: "🥈" },
  { rank: 3,  name: "Thu Hà",       avatar: "👩‍🏫", xp: 2410, streak: 22, accuracy: 89, badge: "🥉" },
  { rank: 4,  name: "Đức Khoa",     avatar: "🧑‍💼", xp: 2100, streak: 18, accuracy: 85, badge: ""   },
  { rank: 5,  name: "Phương Linh",  avatar: "👩‍🔬", xp: 1980, streak: 15, accuracy: 83, badge: ""   },
  { rank: 6,  name: "Bạn",          avatar: "⭐",   xp: 1750, streak: 12, accuracy: 87, badge: "", isMe: true },
  { rank: 7,  name: "Quang Huy",    avatar: "🧑‍🎨", xp: 1600, streak: 10, accuracy: 80, badge: ""   },
  { rank: 8,  name: "Ngọc Anh",     avatar: "👩‍🎤", xp: 1480, streak: 8,  accuracy: 78, badge: ""   },
  { rank: 9,  name: "Trí Dũng",     avatar: "👨‍🏋️", xp: 1320, streak: 7,  accuracy: 75, badge: ""   },
  { rank: 10, name: "Lan Phương",   avatar: "👩‍🌾", xp: 1200, streak: 5,  accuracy: 72, badge: ""   },
];

const COLORS = ["#F5A623", "#9CA3AF", "#CD7F32"];

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>("week");
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const periods: { id: Period; label: string }[] = [
    { id: "week",    label: "Tuần này"   },
    { id: "month",   label: "Tháng này"  },
    { id: "alltime", label: "Mọi thời đại" },
  ];

  const top3 = WEEKLY_DATA.slice(0, 3);
  const rest  = WEEKLY_DATA.slice(3);
  const me    = WEEKLY_DATA.find(l => l.isMe);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px" }}>

      {/* Header */}
      <div className="animate-fade-up" style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>🏆</div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: "clamp(26px,4vw,36px)", color: "var(--navy)", marginBottom: 8 }}>
          Bảng xếp hạng
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 15 }}>Cạnh tranh lành mạnh, học hiệu quả hơn mỗi ngày</p>
      </div>

      {/* Period selector */}
      <div className="animate-fade-up stagger-1" style={{ display: "flex", background: "white", border: "1.5px solid var(--border)", borderRadius: 14, padding: 5, gap: 4, marginBottom: 32 }}>
        {periods.map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)} style={{
            flex: 1, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer",
            fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 14,
            background: period === p.id ? "var(--navy)" : "transparent",
            color:      period === p.id ? "white"       : "var(--muted)",
            transition: "all .2s",
          }}>{p.label}</button>
        ))}
      </div>

      {/* Your rank (if not in top 3) */}
      {me && me.rank > 3 && (
        <div className="animate-fade-up stagger-1" style={{
          background: "linear-gradient(135deg, rgba(0,200,150,.08), rgba(245,166,35,.06))",
          border: "2px solid var(--emerald)", borderRadius: 18, padding: "16px 20px",
          marginBottom: 28, display: "flex", alignItems: "center", gap: 16,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Vị trí của bạn</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 22, color: "var(--navy)", minWidth: 32 }}>#{me.rank}</div>
          <div style={{ fontSize: 24 }}>{me.avatar}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--navy)" }}>{me.name}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>🔥 {me.streak} ngày · 🎯 {me.accuracy}%</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 20, color: "var(--emerald)" }}>{me.xp.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>XP</div>
          </div>
        </div>
      )}

      {/* ── Top 3 Podium ── */}
      <div className="animate-fade-up stagger-2" style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 12, marginBottom: 36, padding: "0 16px" }}>
        {/* 2nd */}
        {[top3[1], top3[0], top3[2]].map((leader, idx) => {
          const displayRank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
          const heights = [110, 140, 90];
          const height = heights[idx];
          return (
            <div key={leader.rank} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              {/* Avatar */}
              <div style={{
                width: displayRank === 1 ? 64 : 52,
                height: displayRank === 1 ? 64 : 52,
                borderRadius: "50%",
                background: "white",
                border: `3px solid ${COLORS[displayRank - 1]}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: displayRank === 1 ? 28 : 22,
                boxShadow: `0 4px 20px ${COLORS[displayRank - 1]}40`,
                position: "relative",
              }}>
                {leader.avatar}
                <div style={{
                  position: "absolute", bottom: -4, right: -4,
                  width: 22, height: 22, borderRadius: "50%",
                  background: COLORS[displayRank - 1],
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "white",
                  border: "2px solid white",
                }}>{displayRank}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--navy)" }}>{leader.name}</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 15, color: COLORS[displayRank - 1] }}>{leader.xp.toLocaleString()} XP</div>
              </div>
              {/* Podium block */}
              <div style={{
                width: "100%", height, borderRadius: "12px 12px 0 0",
                background: `linear-gradient(180deg, ${COLORS[displayRank - 1]}22, ${COLORS[displayRank - 1]}44)`,
                border: `1.5px solid ${COLORS[displayRank - 1]}55`,
                borderBottom: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28,
              }}>
                {leader.badge || `#${displayRank}`}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Rank list (4–10) ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rest.map((leader, i) => (
          <div
            key={leader.rank}
            className={`animate-fade-up stagger-${Math.min(i + 1, 6)}`}
            onMouseEnter={() => setHoveredId(leader.rank)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              display: "flex", alignItems: "center", gap: 16,
              background: leader.isMe
                ? "linear-gradient(135deg, rgba(0,200,150,.08), rgba(245,166,35,.05))"
                : hoveredId === leader.rank ? "white" : "white",
              border: leader.isMe
                ? "2px solid var(--emerald)"
                : hoveredId === leader.rank
                  ? "1.5px solid var(--navy)"
                  : "1.5px solid var(--border)",
              borderRadius: 16, padding: "14px 20px",
              transition: "all .2s", cursor: "default",
            }}
          >
            {/* Rank */}
            <div style={{
              width: 32, textAlign: "center",
              fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 16,
              color: leader.isMe ? "var(--emerald)" : "var(--muted)",
            }}>
              #{leader.rank}
            </div>

            {/* Avatar */}
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: leader.isMe ? "rgba(0,200,150,.1)" : "var(--cream-2)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            }}>{leader.avatar}</div>

            {/* Name + meta */}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--navy)" }}>
                {leader.name}
                {leader.isMe && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: "var(--emerald)", padding: "1px 7px", borderRadius: 10, background: "rgba(0,200,150,.1)" }}>Bạn</span>}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                🔥 {leader.streak} ngày · 🎯 {leader.accuracy}% chính xác
              </div>
            </div>

            {/* XP */}
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 18, color: leader.isMe ? "var(--emerald)" : "var(--navy)" }}>
                {leader.xp.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, letterSpacing: "0.04em" }}>XP</div>
            </div>
          </div>
        ))}
      </div>

      {/* Motivational footer */}
      <div style={{ marginTop: 32, background: "var(--navy)", borderRadius: 20, padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "white", marginBottom: 4 }}>
            Bạn cần thêm <span style={{ color: "var(--emerald)" }}>230 XP</span> để vượt #5
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.6)" }}>Hãy luyện tập thêm hôm nay! 💪</div>
        </div>
        <a href="/study" style={{
          background: "var(--emerald)", color: "var(--navy)",
          padding: "10px 22px", borderRadius: 12, fontWeight: 700, fontSize: 14,
          textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
        }}>
          Học ngay 🚀
        </a>
      </div>
    </div>
  );
}