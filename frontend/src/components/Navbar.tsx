import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useSRS } from "../hooks/UseSRS";
import DueCardsBadge from "./DueCardsBadge";
import { useNotification, notifyDueCards } from "../utils/useNotification";

export default function Navbar() {
  const [menuOpen, setMenuOpen]         = useState(false);
  const [searchOpen, setSearchOpen]     = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen]       = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();

  // ── SRS: global due count (tất cả deck của user) ──────────────────────
  const srs = useSRS();
  useEffect(() => {
    if (user) {
      srs.loadDueCards(); // không truyền deckId → lấy tất cả
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  // ── Notification API ──────────────────────────────────────────────────
  const notification = useNotification();
  // Gửi browser notification 1 lần khi đã có quyền + có due cards
  useEffect(() => {
    if (
      notification.permission === "granted" &&
      srs.dueCount > 0 &&
      !sessionStorage.getItem("lexi-notif-sent")
    ) {
      notifyDueCards(srs.dueCount, notification.notify);
      sessionStorage.setItem("lexi-notif-sent", "1");
    }
  }, [notification.permission, srs.dueCount, notification.notify]);

  const navLinks = [
    { to: "/decks",       label: "Flashcards"               },
    { to: "/saved-decks", label: "Đã lưu"                   },
    { to: "/quiz",        label: "Quiz", badge: "New"        },
    { to: "/schedule",    label: "Lịch ôn tập"              },
    { to: "/progress",    label: "Tiến trình"               },
  ];

  const isActive = (to: string) => location.pathname.startsWith(to);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setMenuOpen(false);
    navigate("/");
  };

  const initials = user?.displayName
    ? user.displayName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <header style={{ background: "var(--navy)", position: "sticky", top: 0, zIndex: 40, boxShadow: "0 1px 0 rgba(255,255,255,.06)" }}>
      <nav style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

        {/* Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,var(--emerald),#00a87f)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "var(--navy)", fontFamily: "'Fraunces',serif" }}>L</div>
          <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 20, color: "white", letterSpacing: "-0.3px" }}>LexiLearn</span>
        </Link>

        {/* Desktop nav links */}
        <div className="nav-desktop-links">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 10, fontSize: 14, fontWeight: 500, textDecoration: "none", color: isActive(link.to) ? "var(--emerald)" : "rgba(255,255,255,.72)", background: isActive(link.to) ? "rgba(0,200,150,.12)" : "transparent", transition: "all .2s" }}>
              {link.label}
              {link.badge && <span style={{ background: "var(--emerald)", color: "var(--navy)", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 20 }}>{link.badge}</span>}
              {/* Due badge on "Lịch ôn tập" */}
              {link.to === "/schedule" && user && srs.dueCount > 0 && (
                <DueCardsBadge count={srs.dueCount} size="sm" />
              )}
            </Link>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

          {/* 🔔 Notification bell – chỉ show khi đăng nhập */}
          {user && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => { setNotifOpen(o => !o); setSearchOpen(false); setDropdownOpen(false); }}
                aria-label="Thông báo"
                style={{
                  background: notifOpen ? "rgba(0,200,150,.15)" : "rgba(255,255,255,.08)",
                  border: "none", borderRadius: 10, width: 38, height: 38,
                  cursor: "pointer", color: "white", fontSize: 16,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative", transition: "all .2s", flexShrink: 0,
                }}
              >
                🔔
                {srs.dueCount > 0 && (
                  <span style={{
                    position: "absolute", top: 4, right: 4,
                    width: 8, height: 8, borderRadius: "50%",
                    background: "#FF6B6B", border: "2px solid var(--navy)",
                  }} />
                )}
              </button>

              {/* Notification dropdown */}
              {notifOpen && (
                <>
                  <div onClick={() => setNotifOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 10 }} />
                  <div style={{
                    position: "absolute", right: 0, top: "calc(100% + 8px)",
                    background: "var(--navy-2)", border: "1px solid rgba(255,255,255,.1)",
                    borderRadius: 14, padding: 4, minWidth: 280, zIndex: 20,
                    boxShadow: "0 8px 32px rgba(0,0,0,.4)",
                  }}>
                    {/* Header */}
                    <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "white", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span>📅 Nhắc ôn tập</span>
                        {srs.dueCount > 0 && <DueCardsBadge count={srs.dueCount} size="sm" />}
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ padding: "10px 4px" }}>
                      {srs.dueLoading ? (
                        <div style={{ padding: "12px 14px", color: "rgba(255,255,255,.5)", fontSize: 13 }}>Đang tải…</div>
                      ) : srs.dueCount === 0 ? (
                        <div style={{ padding: "14px", textAlign: "center" }}>
                          <div style={{ fontSize: 24, marginBottom: 6 }}>🎉</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--emerald)" }}>Bạn đã ôn hết hôm nay!</div>
                        </div>
                      ) : (
                        <>
                          <div style={{ padding: "8px 14px 6px", fontSize: 12, color: "rgba(255,255,255,.55)" }}>
                            Bạn có <span style={{ color: "#FF6B6B", fontWeight: 700 }}>{srs.dueCount} từ</span> cần ôn hôm nay
                          </div>
                          {/* Show up to 5 due cards */}
                          {srs.dueCards.slice(0, 5).map(card => (
                            <div key={card._id} style={{ padding: "8px 14px", display: "flex", justifyContent: "space-between", gap: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: "white" }}>{card.front}</span>
                              <span style={{ fontSize: 13, color: "rgba(255,255,255,.45)" }}>{card.back}</span>
                            </div>
                          ))}
                          {srs.dueCount > 5 && (
                            <div style={{ padding: "4px 14px 6px", fontSize: 12, color: "rgba(255,255,255,.4)" }}>
                              … và {srs.dueCount - 5} từ nữa
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", padding: "8px 4px 4px", display: "flex", gap: 6, flexDirection: "column" }}>
                      <Link to="/schedule" onClick={() => setNotifOpen(false)}
                        style={{ display: "block", padding: "9px 12px", borderRadius: 8, fontSize: 13, color: "rgba(255,255,255,.8)", textDecoration: "none", fontWeight: 500 }}>
                        📅 Xem lịch ôn tập
                      </Link>
                      {/* Notification permission request */}
                      {notification.isSupported && notification.permission === "default" && (
                        <button
                          onClick={() => notification.requestPermission()}
                          style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 12px", borderRadius: 8, fontSize: 13, color: "var(--emerald)", background: "rgba(0,200,150,.1)", border: "none", cursor: "pointer", fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}
                        >
                          🔔 Bật thông báo nhắc ôn
                        </button>
                      )}
                      {notification.permission === "granted" && (
                        <div style={{ padding: "6px 12px", fontSize: 12, color: "rgba(255,255,255,.4)" }}>
                          ✅ Thông báo đã bật
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 🔍 Search */}
          <button onClick={() => { setSearchOpen(s => !s); setMenuOpen(false); setNotifOpen(false); }} aria-label="Search"
            style={{ background: searchOpen ? "rgba(0,200,150,.15)" : "rgba(255,255,255,.08)", border: "none", borderRadius: 10, width: 38, height: 38, cursor: "pointer", color: searchOpen ? "var(--emerald)" : "rgba(255,255,255,.75)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s", flexShrink: 0 }}>
            🔍
          </button>

          {/* Auth section */}
          {user ? (
            <div style={{ position: "relative" }} className="nav-desktop-auth">
              <button
                onClick={() => setDropdownOpen(o => !o)}
                style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.08)", border: "1.5px solid rgba(255,255,255,.15)", borderRadius: 10, padding: "5px 12px 5px 6px", cursor: "pointer", transition: "all .2s" }}
              >
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--emerald)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--navy)", flexShrink: 0 }}>
                  {initials}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "white", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.displayName}
                </span>
                <span style={{ color: "rgba(255,255,255,.5)", fontSize: 10 }}>▾</span>
              </button>

              {dropdownOpen && (
                <>
                  <div onClick={() => setDropdownOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 10 }} />
                  <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "var(--navy-2)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, padding: "8px", minWidth: 180, zIndex: 20, boxShadow: "0 8px 32px rgba(0,0,0,.4)" }}>
                    <div style={{ padding: "8px 12px 12px", borderBottom: "1px solid rgba(255,255,255,.08)", marginBottom: 6 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{user.displayName}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,.45)", marginTop: 2 }}>{user.email}</div>
                    </div>
                    <Link to="/profile" onClick={() => setDropdownOpen(false)} style={{ display: "block", padding: "9px 12px", borderRadius: 8, fontSize: 13, color: "rgba(255,255,255,.8)", textDecoration: "none", fontWeight: 500 }}>👤 Hồ sơ cá nhân</Link>
                    <Link to="/my-decks" onClick={() => setDropdownOpen(false)} style={{ display: "block", padding: "9px 12px", borderRadius: 8, fontSize: 13, color: "rgba(255,255,255,.8)", textDecoration: "none", fontWeight: 500 }}>📚 Deck của tôi</Link>
                    <Link to="/saved-decks" onClick={() => setDropdownOpen(false)} style={{ display: "block", padding: "9px 12px", borderRadius: 8, fontSize: 13, color: "rgba(255,255,255,.8)", textDecoration: "none", fontWeight: 500 }}>🔖 Deck đã lưu</Link>
                    <Link to="/schedule" onClick={() => setDropdownOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderRadius: 8, fontSize: 13, color: "rgba(255,255,255,.8)", textDecoration: "none", fontWeight: 500 }}>
                      📅 Lịch ôn tập
                      {srs.dueCount > 0 && <DueCardsBadge count={srs.dueCount} size="sm" />}
                    </Link>
                    <Link to="/progress" onClick={() => setDropdownOpen(false)} style={{ display: "block", padding: "9px 12px", borderRadius: 8, fontSize: 13, color: "rgba(255,255,255,.8)", textDecoration: "none", fontWeight: 500 }}>📊 Tiến trình học</Link>
                    <Link to="/settings" onClick={() => setDropdownOpen(false)} style={{ display: "block", padding: "9px 12px", borderRadius: 8, fontSize: 13, color: "rgba(255,255,255,.8)", textDecoration: "none", fontWeight: 500 }}>⚙️ Cài đặt</Link>
                    <button onClick={handleLogout} style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 12px", borderRadius: 8, fontSize: 13, color: "#FF6B6B", background: "none", border: "none", cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 500, marginTop: 4 }}>🚪 Đăng xuất</button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="nav-desktop-auth">
              <Link to="/login"    style={{ color: "rgba(255,255,255,.8)", textDecoration: "none", fontSize: 14, fontWeight: 500, padding: "8px 16px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,.2)", whiteSpace: "nowrap" }}>Đăng nhập</Link>
              <Link to="/register" style={{ background: "var(--emerald)", color: "var(--navy)", textDecoration: "none", fontSize: 14, fontWeight: 700, padding: "8px 18px", borderRadius: 10, whiteSpace: "nowrap" }}>Đăng ký</Link>
            </div>
          )}

          <button className="nav-hamburger" onClick={() => { setMenuOpen(o => !o); setSearchOpen(false); setNotifOpen(false); }} aria-label="Menu"
            style={{ background: menuOpen ? "rgba(0,200,150,.15)" : "rgba(255,255,255,.08)", border: "none", borderRadius: 10, width: 38, height: 38, cursor: "pointer", color: "white", fontSize: 16, alignItems: "center", justifyContent: "center", transition: "all .2s", flexShrink: 0 }}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* Search bar */}
      {searchOpen && (
        <div style={{ background: "var(--navy-2)", borderTop: "1px solid rgba(255,255,255,.07)", padding: "12px 24px 16px" }}>
          <div style={{ maxWidth: 520, margin: "0 auto", position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, pointerEvents: "none" }}>🔍</span>
            <input autoFocus type="text" placeholder="Tìm bộ flashcard, ngôn ngữ, chủ đề..."
              style={{ width: "100%", padding: "10px 16px 10px 42px", boxSizing: "border-box", border: "1.5px solid rgba(255,255,255,.15)", borderRadius: 12, background: "rgba(255,255,255,.08)", color: "white", fontFamily: "'Outfit',sans-serif", fontSize: 14, outline: "none" }} />
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ background: "var(--navy-2)", borderTop: "1px solid rgba(255,255,255,.07)", padding: "8px 20px 20px" }}>
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 4px 14px", borderBottom: "1px solid rgba(255,255,255,.08)", marginBottom: 4 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--emerald)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--navy)", flexShrink: 0 }}>{initials}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "white" }}>{user.displayName}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.45)" }}>{user.email}</div>
              </div>
              {srs.dueCount > 0 && <DueCardsBadge count={srs.dueCount} />}
            </div>
          )}

          {navLinks.map(link => (
            <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 4px", color: isActive(link.to) ? "var(--emerald)" : "rgba(255,255,255,.85)", textDecoration: "none", fontSize: 15, fontWeight: 500, borderBottom: "1px solid rgba(255,255,255,.06)" }}>
              <span>{link.label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {link.badge && <span style={{ background: "var(--emerald)", color: "var(--navy)", fontSize: 10, fontWeight: 700, padding: "1px 8px", borderRadius: 20 }}>{link.badge}</span>}
                {link.to === "/schedule" && user && srs.dueCount > 0 && <DueCardsBadge count={srs.dueCount} size="sm" />}
                <span style={{ color: "rgba(255,255,255,.3)", fontSize: 14 }}>→</span>
              </div>
            </Link>
          ))}

          {user ? (
            <button onClick={handleLogout} style={{ width: "100%", marginTop: 16, padding: "11px", background: "rgba(255,107,107,.15)", border: "1.5px solid rgba(255,107,107,.3)", borderRadius: 10, color: "#FF6B6B", fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              🚪 Đăng xuất
            </button>
          ) : (
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <Link to="/login"    onClick={() => setMenuOpen(false)} style={{ flex: 1, textAlign: "center", padding: "11px", border: "1.5px solid rgba(255,255,255,.25)", borderRadius: 10, color: "white", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Đăng nhập</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} style={{ flex: 1, textAlign: "center", padding: "11px", background: "var(--emerald)", borderRadius: 10, color: "var(--navy)", textDecoration: "none", fontSize: 14, fontWeight: 700 }}>Đăng ký</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}