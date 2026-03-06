import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

interface Deck {
  _id: string;
  name: string;
  language: string;
  cardCount: number;
  description?: string;
  isPublic?: boolean;
}

const FLAG: Record<string, string> = {
  en: "🇬🇧", ja: "🇯🇵", fr: "🇫🇷",
  zh: "🇨🇳", de: "🇩🇪", ko: "🇰🇷", vi: "🇻🇳",
};

const COUNT_OPTIONS = [
  { label: "10 câu",       value: 10,    icon: "⚡" },
  { label: "20 câu",       value: 20,    icon: "🎯" },
  { label: "50 câu",       value: 50,    icon: "💪" },
  { label: "Tất cả",       value: 9999,  icon: "🔥" },
];

const TIMER_OPTIONS = [
  { label: "Không giới hạn", value: 0,   icon: "∞" },
  { label: "30 giây/câu",    value: 30,  icon: "⏱" },
  { label: "15 giây/câu",    value: 15,  icon: "⚡" },
];

export default function QuizSetupPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [myDecks, setMyDecks]         = useState<Deck[]>([]);
  const [publicDecks, setPublicDecks] = useState<Deck[]>([]);
  const [loadingDecks, setLoadingDecks] = useState(true);
  const [activeTab, setActiveTab]     = useState<"my" | "public">(user ? "my" : "public");
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [count, setCount]             = useState(20);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [deckSearch, setDeckSearch]   = useState("");

  // Load cả deck của user lẫn public decks song song
  useEffect(() => {
    const load = async () => {
      setLoadingDecks(true);
      try {
        const requests: Promise<any>[] = [api.get("/decks/public?limit=50")];
        if (user) requests.push(api.get("/decks/my?limit=50"));

        const [pubRes, myRes] = await Promise.allSettled(requests);

        if (pubRes.status === "fulfilled" && pubRes.value.data?.success) {
          setPublicDecks(pubRes.value.data.data ?? []);
        }
        if (myRes && myRes.status === "fulfilled" && myRes.value.data?.success) {
          setMyDecks(myRes.value.data.data ?? []);
        }
      } catch {
        // silent
      } finally {
        setLoadingDecks(false);
      }
    };
    load();
  }, [user]);

  // Khi user đăng nhập lần đầu, default sang tab "my"
  useEffect(() => {
    if (user) setActiveTab("my");
  }, [user]);

  // Deck list hiển thị theo tab đang active
  const decks = activeTab === "my" ? myDecks : publicDecks;

  const filteredDecks = decks.filter(d =>
    d.name.toLowerCase().includes(deckSearch.toLowerCase())
  );

  const handleStart = () => {
    if (!selectedDeck) return;
    const actualCount = Math.min(count, selectedDeck.cardCount);
    const params = new URLSearchParams({
      count: String(actualCount),
      timer: String(timerSeconds),
    });
    navigate(`/quiz/play/${selectedDeck._id}?${params.toString()}`);
  };

  const canStart = selectedDeck && selectedDeck.cardCount >= 2;

  return (
    <div style={{
      maxWidth: 860,
      margin: "0 auto",
      padding: "40px 24px 80px",
    }}>
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: 40 }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(0,200,150,0.1)",
          border: "1px solid rgba(0,200,150,0.25)",
          borderRadius: 20,
          padding: "5px 14px",
          fontSize: 12,
          fontWeight: 700,
          color: "var(--emerald-d)",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          marginBottom: 16,
        }}>
          ❓ Quiz Mode
        </div>
        <h1 style={{
          fontFamily: "'Fraunces', serif",
          fontWeight: 700,
          fontSize: "clamp(28px, 4vw, 40px)",
          color: "var(--navy)",
          marginBottom: 10,
          letterSpacing: "-0.5px",
        }}>
          Thiết lập bài kiểm tra
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.6 }}>
          Chọn bộ từ vựng và cấu hình quiz theo ý muốn của bạn.
        </p>
        <Link
          to="/quiz/history"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginTop: 12,
            fontSize: 13,
            color: "var(--muted)",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          📋 Xem lịch sử quiz →
        </Link>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 24,
        alignItems: "start",
      }}>

        {/* ── Left: Deck Selection ── */}
        <div className="animate-fade-up stagger-1" style={{
          gridColumn: "1 / -1",
        }}>
          <div style={{
            background: "white",
            border: "1.5px solid var(--border)",
            borderRadius: 20,
            padding: "24px",
            boxShadow: "0 4px 20px rgba(13,27,42,.04)",
          }}>
            {/* Header row */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
              gap: 12,
              flexWrap: "wrap",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "var(--cream-2)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                }}>📚</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--navy)" }}>
                  Chọn bộ flashcard
                </div>
              </div>

              {/* Tab switcher */}
              <div style={{
                display: "flex",
                background: "var(--cream-2)",
                borderRadius: 10,
                padding: 3,
                gap: 2,
              }}>
                {user && (
                  <button
                    onClick={() => { setActiveTab("my"); setSelectedDeck(null); setDeckSearch(""); }}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      border: "none",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "'Outfit', sans-serif",
                      transition: "all .15s",
                      background: activeTab === "my" ? "white" : "transparent",
                      color: activeTab === "my" ? "var(--navy)" : "var(--muted)",
                      boxShadow: activeTab === "my" ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                    }}
                  >
                    ✍️ Deck của tôi
                    {myDecks.length > 0 && (
                      <span style={{
                        marginLeft: 6, background: activeTab === "my" ? "var(--navy)" : "var(--muted)",
                        color: "white", borderRadius: 99, padding: "1px 6px", fontSize: 10, fontWeight: 700,
                      }}>{myDecks.length}</span>
                    )}
                  </button>
                )}
                <button
                  onClick={() => { setActiveTab("public"); setSelectedDeck(null); setDeckSearch(""); }}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    border: "none",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "'Outfit', sans-serif",
                    transition: "all .15s",
                    background: activeTab === "public" ? "white" : "transparent",
                    color: activeTab === "public" ? "var(--navy)" : "var(--muted)",
                    boxShadow: activeTab === "public" ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                  }}
                >
                  🌐 Public
                  {publicDecks.length > 0 && (
                    <span style={{
                      marginLeft: 6, background: activeTab === "public" ? "var(--navy)" : "var(--muted)",
                      color: "white", borderRadius: 99, padding: "1px 6px", fontSize: 10, fontWeight: 700,
                    }}>{publicDecks.length}</span>
                  )}
                </button>
              </div>
            </div>

            {/* Search */}
            <div style={{ position: "relative", marginBottom: 14 }}>
              <span style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 14,
                pointerEvents: "none",
                color: "var(--muted)",
              }}>🔍</span>
              <input
                type="text"
                placeholder="Tìm bộ flashcard..."
                value={deckSearch}
                onChange={e => setDeckSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px 10px 36px",
                  borderRadius: 12,
                  border: "1.5px solid var(--border)",
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 14,
                  outline: "none",
                  background: "var(--cream)",
                  color: "var(--navy)",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Deck list */}
            <div style={{
              maxHeight: 320,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              paddingRight: 4,
            }}>
              {loadingDecks ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ borderRadius: 12, height: 60 }} />
                ))
              ) : filteredDecks.length === 0 ? (
                <div style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "var(--muted)",
                  fontSize: 14,
                }}>
                  {activeTab === "my" && user ? (
                    <>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                      <div>Bạn chưa có deck nào.</div>
                      <Link to="/my-decks" style={{ color: "var(--emerald-d)", fontWeight: 600, fontSize: 13 }}>
                        Tạo deck đầu tiên →
                      </Link>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
                      <div>Không tìm thấy kết quả</div>
                    </>
                  )}
                </div>
              ) : (
                filteredDecks.map(deck => {
                  const isSelected = selectedDeck?._id === deck._id;
                  const tooFewCards = deck.cardCount < 2;
                  return (
                    <button
                      key={deck._id}
                      onClick={() => !tooFewCards && setSelectedDeck(deck)}
                      disabled={tooFewCards}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: "14px 16px",
                        borderRadius: 14,
                        border: isSelected
                          ? "2px solid var(--emerald)"
                          : "1.5px solid var(--border)",
                        background: isSelected
                          ? "rgba(0,200,150,0.06)"
                          : tooFewCards
                          ? "var(--cream)"
                          : "white",
                        cursor: tooFewCards ? "not-allowed" : "pointer",
                        textAlign: "left",
                        transition: "all .15s",
                        opacity: tooFewCards ? 0.5 : 1,
                        width: "100%",
                        fontFamily: "'Outfit', sans-serif",
                      }}
                    >
                      {/* Flag */}
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: isSelected ? "rgba(0,200,150,0.12)" : "var(--cream-2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        flexShrink: 0,
                      }}>
                        {FLAG[deck.language] || "🌐"}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 700,
                          fontSize: 14,
                          color: isSelected ? "var(--navy)" : "var(--navy)",
                          marginBottom: 2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                          {deck.name}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>
                          {tooFewCards
                            ? "⚠️ Cần ít nhất 2 thẻ"
                            : `📇 ${deck.cardCount} thẻ · ${deck.language.toUpperCase()}`}
                        </div>
                      </div>

                      {/* Checkmark */}
                      {isSelected && (
                        <div style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: "var(--emerald)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: 12,
                          flexShrink: 0,
                          fontWeight: 700,
                        }}>✓</div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── Count Selection ── */}
        <div className="animate-fade-up stagger-2" style={{
          background: "white",
          border: "1.5px solid var(--border)",
          borderRadius: 20,
          padding: "24px",
          boxShadow: "0 4px 20px rgba(13,27,42,.04)",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 18,
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--cream-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}>🔢</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--navy)" }}>
                Số câu hỏi
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                {selectedDeck
                  ? `Tối đa ${selectedDeck.cardCount} câu`
                  : "Chọn deck trước"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {COUNT_OPTIONS.map(opt => {
              const isActive = count === opt.value;
              const isDisabled = selectedDeck
                ? (opt.value !== 9999 && opt.value > selectedDeck.cardCount)
                : false;
              return (
                <button
                  key={opt.value}
                  onClick={() => !isDisabled && setCount(opt.value)}
                  disabled={isDisabled}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: isActive
                      ? "2px solid var(--navy)"
                      : "1.5px solid var(--border)",
                    background: isActive ? "var(--navy)" : "white",
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    opacity: isDisabled ? 0.4 : 1,
                    fontFamily: "'Outfit', sans-serif",
                    transition: "all .15s",
                    width: "100%",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 16 }}>{opt.icon}</span>
                  <span style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: isActive ? "white" : "var(--navy)",
                  }}>
                    {opt.label}
                  </span>
                  {isActive && (
                    <span style={{ marginLeft: "auto", color: "var(--emerald)", fontSize: 14 }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Timer Selection ── */}
        <div className="animate-fade-up stagger-3" style={{
          background: "white",
          border: "1.5px solid var(--border)",
          borderRadius: 20,
          padding: "24px",
          boxShadow: "0 4px 20px rgba(13,27,42,.04)",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 18,
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--cream-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}>⏱</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--navy)" }}>
                Giới hạn thời gian
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                Mỗi câu hỏi
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {TIMER_OPTIONS.map(opt => {
              const isActive = timerSeconds === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setTimerSeconds(opt.value)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: isActive
                      ? "2px solid var(--navy)"
                      : "1.5px solid var(--border)",
                    background: isActive ? "var(--navy)" : "white",
                    cursor: "pointer",
                    fontFamily: "'Outfit', sans-serif",
                    transition: "all .15s",
                    width: "100%",
                    textAlign: "left",
                  }}
                >
                  <span style={{
                    fontSize: opt.value === 0 ? 18 : 15,
                    fontWeight: 800,
                    color: isActive ? "var(--emerald)" : "var(--muted)",
                    minWidth: 20,
                    textAlign: "center",
                    fontFamily: opt.value === 0 ? "serif" : "inherit",
                  }}>
                    {opt.icon}
                  </span>
                  <span style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: isActive ? "white" : "var(--navy)",
                  }}>
                    {opt.label}
                  </span>
                  {isActive && (
                    <span style={{ marginLeft: "auto", color: "var(--emerald)", fontSize: 14 }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Summary + Start ── */}
        <div
          className="animate-fade-up stagger-4"
          style={{ gridColumn: "1 / -1" }}
        >
          {/* Summary card */}
          {selectedDeck && (
            <div style={{
              background: "linear-gradient(135deg, var(--navy), #1a2f45)",
              borderRadius: 20,
              padding: "24px 28px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 24,
              flexWrap: "wrap",
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.5)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>
                  Tóm tắt
                </div>
                <div style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "white",
                  marginBottom: 4,
                }}>
                  {selectedDeck.name}
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.55)" }}>
                  {FLAG[selectedDeck.language]} {selectedDeck.language.toUpperCase()} ·{" "}
                  {Math.min(count === 9999 ? selectedDeck.cardCount : count, selectedDeck.cardCount)} câu hỏi ·{" "}
                  {timerSeconds === 0 ? "Không giới hạn thời gian" : `${timerSeconds}s/câu`}
                </div>
              </div>

              <div style={{ display: "flex", gap: 16 }}>
                {[
                  { icon: "🎯", label: "Câu hỏi", value: Math.min(count === 9999 ? selectedDeck.cardCount : count, selectedDeck.cardCount) },
                  { icon: "⏱", label: "Timer", value: timerSeconds > 0 ? `${timerSeconds}s` : "∞" },
                ].map(stat => (
                  <div key={stat.label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 22, marginBottom: 2 }}>{stat.icon}</div>
                    <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 22, color: "var(--emerald)" }}>{stat.value}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", fontWeight: 500 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={!canStart}
            style={{
              width: "100%",
              padding: "16px 28px",
              borderRadius: 16,
              border: "none",
              background: canStart
                ? "linear-gradient(135deg, #00C896, #00a87f)"
                : "var(--cream-2)",
              color: canStart ? "var(--navy)" : "var(--muted)",
              fontFamily: "'Outfit', sans-serif",
              fontSize: 16,
              fontWeight: 800,
              cursor: canStart ? "pointer" : "not-allowed",
              boxShadow: canStart ? "0 8px 30px rgba(0,200,150,.3)" : "none",
              transition: "all .2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              letterSpacing: "-0.2px",
            }}
            onMouseEnter={e => {
              if (canStart) {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 36px rgba(0,200,150,.4)";
              }
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = canStart ? "0 8px 30px rgba(0,200,150,.3)" : "none";
            }}
          >
            {canStart ? (
              <>🚀 Bắt đầu Quiz</>
            ) : (
              <>⬆️ Chọn bộ flashcard để bắt đầu</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}