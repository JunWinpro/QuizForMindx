import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [menuOpen, setMenuOpen]     = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();

  const navLinks = [
    { to: "/decks",       label: "Flashcards"               },
    { to: "/study",       label: "Luyện tập", badge: "New"  },
    { to: "/progress",    label: "Tiến trình"               },
    { to: "/leaderboard", label: "Bảng xếp hạng"            },
  ];

  const isActive = (to: string) => location.pathname.startsWith(to);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setMenuOpen(false);
    navigate("/");
  };

  // Avatar initials
  const initials = user?.displayName
    ? user.displayName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <header style={{ background:"var(--navy)", position:"sticky", top:0, zIndex:40, boxShadow:"0 1px 0 rgba(255,255,255,.06)" }}>
      <nav style={{ maxWidth:1280, margin:"0 auto", padding:"0 24px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between" }}>

        <Link to="/" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none", flexShrink:0 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,var(--emerald),#00a87f)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:900, color:"var(--navy)", fontFamily:"'Fraunces',serif" }}>L</div>
          <span style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:20, color:"white", letterSpacing:"-0.3px" }}>LexiLearn</span>
        </Link>

        {/* Desktop nav links */}
        <div className="nav-desktop-links">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"7px 13px", borderRadius:10, fontSize:14, fontWeight:500, textDecoration:"none", color:isActive(link.to)?"var(--emerald)":"rgba(255,255,255,.72)", background:isActive(link.to)?"rgba(0,200,150,.12)":"transparent", transition:"all .2s" }}>
              {link.label}
              {link.badge && <span style={{ background:"var(--emerald)", color:"var(--navy)", fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:20 }}>{link.badge}</span>}
            </Link>
          ))}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={() => { setSearchOpen(s => !s); setMenuOpen(false); }} aria-label="Search"
            style={{ background:searchOpen?"rgba(0,200,150,.15)":"rgba(255,255,255,.08)", border:"none", borderRadius:10, width:38, height:38, cursor:"pointer", color:searchOpen?"var(--emerald)":"rgba(255,255,255,.75)", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", transition:"all .2s", flexShrink:0 }}>
            🔍
          </button>

          {/* ── Auth section ── */}
          {user ? (
            /* Logged in: avatar + dropdown */
            <div style={{ position:"relative" }} className="nav-desktop-auth">
              <button
                onClick={() => setDropdownOpen(o => !o)}
                style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,.08)", border:"1.5px solid rgba(255,255,255,.15)", borderRadius:10, padding:"5px 12px 5px 6px", cursor:"pointer", transition:"all .2s" }}
              >
                <div style={{ width:28, height:28, borderRadius:"50%", background:"var(--emerald)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"var(--navy)", flexShrink:0 }}>
                  {initials}
                </div>
                <span style={{ fontSize:13, fontWeight:600, color:"white", maxWidth:100, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {user.displayName}
                </span>
                <span style={{ color:"rgba(255,255,255,.5)", fontSize:10 }}>▾</span>
              </button>

              {dropdownOpen && (
                <>
                  {/* Backdrop */}
                  <div onClick={() => setDropdownOpen(false)} style={{ position:"fixed", inset:0, zIndex:10 }}/>
                  {/* Dropdown */}
                  <div style={{ position:"absolute", right:0, top:"calc(100% + 8px)", background:"var(--navy-2)", border:"1px solid rgba(255,255,255,.1)", borderRadius:12, padding:"8px", minWidth:180, zIndex:20, boxShadow:"0 8px 32px rgba(0,0,0,.4)" }}>
                    <div style={{ padding:"8px 12px 12px", borderBottom:"1px solid rgba(255,255,255,.08)", marginBottom:6 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"white" }}>{user.displayName}</div>
                      <div style={{ fontSize:12, color:"rgba(255,255,255,.45)", marginTop:2 }}>{user.email}</div>
                    </div>
                    <Link to="/profile" onClick={() => setDropdownOpen(false)}
                      style={{ display:"block", padding:"9px 12px", borderRadius:8, fontSize:13, color:"rgba(255,255,255,.8)", textDecoration:"none", fontWeight:500 }}>
                      👤 Hồ sơ cá nhân
                    </Link>
                    <Link to="/progress" onClick={() => setDropdownOpen(false)}
                      style={{ display:"block", padding:"9px 12px", borderRadius:8, fontSize:13, color:"rgba(255,255,255,.8)", textDecoration:"none", fontWeight:500 }}>
                      📊 Tiến trình học
                    </Link>
                    <button onClick={handleLogout}
                      style={{ display:"block", width:"100%", textAlign:"left", padding:"9px 12px", borderRadius:8, fontSize:13, color:"#FF6B6B", background:"none", border:"none", cursor:"pointer", fontFamily:"'Outfit',sans-serif", fontWeight:500, marginTop:4 }}>
                      🚪 Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Not logged in */
            <div className="nav-desktop-auth">
              <Link to="/login"    style={{ color:"rgba(255,255,255,.8)", textDecoration:"none", fontSize:14, fontWeight:500, padding:"8px 16px", borderRadius:10, border:"1.5px solid rgba(255,255,255,.2)", whiteSpace:"nowrap" }}>Đăng nhập</Link>
              <Link to="/register" style={{ background:"var(--emerald)", color:"var(--navy)", textDecoration:"none", fontSize:14, fontWeight:700, padding:"8px 18px", borderRadius:10, whiteSpace:"nowrap" }}>Đăng ký</Link>
            </div>
          )}

          <button className="nav-hamburger" onClick={() => { setMenuOpen(o => !o); setSearchOpen(false); }} aria-label="Menu"
            style={{ background:menuOpen?"rgba(0,200,150,.15)":"rgba(255,255,255,.08)", border:"none", borderRadius:10, width:38, height:38, cursor:"pointer", color:"white", fontSize:16, alignItems:"center", justifyContent:"center", transition:"all .2s", flexShrink:0 }}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {searchOpen && (
        <div style={{ background:"var(--navy-2)", borderTop:"1px solid rgba(255,255,255,.07)", padding:"12px 24px 16px" }}>
          <div style={{ maxWidth:520, margin:"0 auto", position:"relative" }}>
            <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:15, pointerEvents:"none" }}>🔍</span>
            <input autoFocus type="text" placeholder="Tìm bộ flashcard, ngôn ngữ, chủ đề..."
              style={{ width:"100%", padding:"10px 16px 10px 42px", boxSizing:"border-box", border:"1.5px solid rgba(255,255,255,.15)", borderRadius:12, background:"rgba(255,255,255,.08)", color:"white", fontFamily:"'Outfit',sans-serif", fontSize:14, outline:"none" }} />
          </div>
        </div>
      )}

      {menuOpen && (
        <div style={{ background:"var(--navy-2)", borderTop:"1px solid rgba(255,255,255,.07)", padding:"8px 20px 20px" }}>
          {/* User info in mobile menu */}
          {user && (
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 4px 14px", borderBottom:"1px solid rgba(255,255,255,.08)", marginBottom:4 }}>
              <div style={{ width:36, height:36, borderRadius:"50%", background:"var(--emerald)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:"var(--navy)", flexShrink:0 }}>
                {initials}
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:"white" }}>{user.displayName}</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,.45)" }}>{user.email}</div>
              </div>
            </div>
          )}

          {navLinks.map(link => (
            <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
              style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 4px", color:isActive(link.to)?"var(--emerald)":"rgba(255,255,255,.85)", textDecoration:"none", fontSize:15, fontWeight:500, borderBottom:"1px solid rgba(255,255,255,.06)" }}>
              {link.label}
              {link.badge
                ? <span style={{ background:"var(--emerald)", color:"var(--navy)", fontSize:10, fontWeight:700, padding:"1px 8px", borderRadius:20 }}>{link.badge}</span>
                : <span style={{ color:"rgba(255,255,255,.3)", fontSize:14 }}>→</span>
              }
            </Link>
          ))}

          {user ? (
            <button onClick={handleLogout}
              style={{ width:"100%", marginTop:16, padding:"11px", background:"rgba(255,107,107,.15)", border:"1.5px solid rgba(255,107,107,.3)", borderRadius:10, color:"#FF6B6B", fontFamily:"'Outfit',sans-serif", fontSize:14, fontWeight:600, cursor:"pointer" }}>
              🚪 Đăng xuất
            </button>
          ) : (
            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              <Link to="/login"    onClick={() => setMenuOpen(false)} style={{ flex:1, textAlign:"center", padding:"11px", border:"1.5px solid rgba(255,255,255,.25)", borderRadius:10, color:"white", textDecoration:"none", fontSize:14, fontWeight:500 }}>Đăng nhập</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} style={{ flex:1, textAlign:"center", padding:"11px", background:"var(--emerald)", borderRadius:10, color:"var(--navy)", textDecoration:"none", fontSize:14, fontWeight:700 }}>Đăng ký</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}