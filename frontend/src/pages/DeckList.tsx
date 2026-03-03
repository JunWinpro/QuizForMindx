import { useEffect, useState } from "react";
import api from "../api/axios";
import type { Deck } from "../types/deck";
import { Link } from "react-router-dom";

const FLAG: Record<string, string> = { en:"🇬🇧", ja:"🇯🇵", fr:"🇫🇷", zh:"🇨🇳", de:"🇩🇪", ko:"🇰🇷" };
const LEVEL_BG:   Record<string, string> = { "Cơ bản":"rgba(69,183,209,.15)", "Trung cấp":"rgba(245,166,35,.15)", "Advanced":"rgba(0,200,150,.15)" };
const LEVEL_TEXT: Record<string, string> = { "Cơ bản":"#45B7D1",             "Trung cấp":"#D4890A",             "Advanced":"#00A87F"              };

export default function DeckList() {
  const [decks,   setDecks]   = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [lang,    setLang]    = useState("all");
  const [level,   setLevel]   = useState("all");

  useEffect(() => {
    api.get("/decks/public")
      .then(res => setDecks(res.data))
      .finally(() => setLoading(false));
  }, []);

  const langs  = ["all", "en", "ja", "fr", "zh", "de"];
  const levels = ["all", "Cơ bản", "Trung cấp", "Advanced"];

  const filtered = decks.filter(d =>
    (lang  === "all" || d.language === lang) &&
    (level === "all" || (d as any).level === level) &&
    (search === "" || d.name.toLowerCase().includes(search.toLowerCase()) || d.description?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ maxWidth:1200, margin:"0 auto", padding:"40px 24px" }}>

      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom:32 }}>
        <h1 style={{ fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:"clamp(26px,4vw,38px)",color:"var(--navy)",marginBottom:8 }}>Bộ Flashcard</h1>
        <p style={{ color:"var(--muted)",fontSize:15 }}>Khám phá {decks.length}+ bộ từ vựng được tuyển chọn kỹ lưỡng</p>
      </div>

      {/* Filter panel */}
      <div className="animate-fade-up stagger-1" style={{ background:"white",border:"1.5px solid var(--border)",borderRadius:20,padding:"20px 24px",marginBottom:32 }}>
        <div style={{ position:"relative",marginBottom:16 }}>
          <span style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:16,pointerEvents:"none" }}>🔍</span>
          <input type="text" placeholder="Tìm kiếm bộ flashcard..." value={search} onChange={e => setSearch(e.target.value)}
            className="input-field" style={{ paddingLeft:42,background:"var(--cream)" }} />
        </div>
        <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"center" }}>
          <span style={{ fontSize:12,fontWeight:600,color:"var(--muted)",letterSpacing:"0.05em",textTransform:"uppercase",marginRight:4 }}>Ngôn ngữ:</span>
          {langs.map(l => (
            <button key={l} onClick={() => setLang(l)} className={`filter-pill${lang===l?" active":""}`}>
              {l === "all" ? "Tất cả" : `${FLAG[l] || ""} ${l.toUpperCase()}`}
            </button>
          ))}
          <div style={{ width:1,height:18,background:"var(--border)",margin:"0 4px" }}/>
          <span style={{ fontSize:12,fontWeight:600,color:"var(--muted)",letterSpacing:"0.05em",textTransform:"uppercase",marginRight:4 }}>Cấp độ:</span>
          {levels.map(lv => (
            <button key={lv} onClick={() => setLevel(lv)} className={`filter-pill${level===lv?" active":""}`}>
              {lv === "all" ? "Tất cả" : lv}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:24 }}>
          {Array.from({length:6}).map((_, i) => (
            <div key={i} className="skeleton" style={{ borderRadius:20,height:220 }}/>
          ))}
        </div>
      ) : (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:24 }}>
          {filtered.map((deck, i) => {
            const d = deck as any;
            return (
              <div key={deck._id} className={`animate-fade-up stagger-${Math.min(i+1,6)}`}>
                <div className="deck-card">
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16 }}>
                    <div style={{ width:44,height:44,borderRadius:12,background:"var(--cream-2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22 }}>
                      {FLAG[deck.language] || "🌐"}
                    </div>
                    {d.level && (
                      <span style={{ fontSize:11,fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase",padding:"3px 10px",borderRadius:20,background:LEVEL_BG[d.level]||"var(--cream-2)",color:LEVEL_TEXT[d.level]||"var(--muted)" }}>
                        {d.level}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontWeight:700,fontSize:16,color:"var(--navy)",marginBottom:8,lineHeight:1.3 }}>{deck.name}</h3>
                  <p style={{ fontSize:13,color:"var(--muted)",lineHeight:1.6,marginBottom:20 }}>{deck.description}</p>

                  <div style={{ height:4,background:"var(--cream-2)",borderRadius:2,overflow:"hidden",marginBottom:20 }}>
                    <div className="progress-fill" style={{ width:"35%" }}/>
                  </div>

                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                    <span style={{ fontSize:13,color:"var(--muted)",fontWeight:500 }}>
                      {FLAG[deck.language]} {deck.language.toUpperCase()} · 📇 {deck.cardCount} cards
                    </span>
                    <Link to={`/decks/${deck._id}`} style={{ background:"var(--navy)",color:"white",padding:"8px 18px",borderRadius:10,fontSize:13,fontWeight:600,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:4 }}>
                      Xem →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign:"center",padding:"80px 24px",color:"var(--muted)" }}>
          <div style={{ fontSize:48,marginBottom:16 }}>🔍</div>
          <div style={{ fontWeight:700,fontSize:18,color:"var(--navy)",marginBottom:8 }}>Không tìm thấy kết quả</div>
          <div style={{ fontSize:14 }}>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</div>
        </div>
      )}
    </div>
  );
}