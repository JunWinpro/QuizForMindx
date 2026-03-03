import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: "/decks",       label: "Flashcards"               },
    { to: "/study",       label: "Luyện tập", badge: "New"  },
    { to: "/progress",    label: "Tiến trình"               },
    { to: "/leaderboard", label: "Bảng xếp hạng"            },
  ];

  const isActive = (to: string) => location.pathname.startsWith(to);

  return (
    <header style={{ background:"var(--navy)", position:"sticky", top:0, zIndex:40, boxShadow:"0 1px 0 rgba(255,255,255,.06)" }}>
      <nav style={{ maxWidth:1280, margin:"0 auto", padding:"0 24px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between" }}>

        <Link to="/" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
          <div style={{ width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,var(--emerald),#00a87f)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:"var(--navy)",fontFamily:"'Fraunces',serif" }}>L</div>
          <span style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:20, color:"white", letterSpacing:"-0.3px" }}>LexiLearn</span>
        </Link>

        <div className="hidden md:flex" style={{ alignItems:"center", gap:2 }}>
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"7px 13px",borderRadius:10,fontSize:14,fontWeight:500,textDecoration:"none", color:isActive(link.to)?"var(--emerald)":"rgba(255,255,255,.72)", background:isActive(link.to)?"rgba(0,200,150,.12)":"transparent", transition:"all .2s" }}>
              {link.label}
              {link.badge && <span style={{ background:"var(--emerald)",color:"var(--navy)",fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:20 }}>{link.badge}</span>}
            </Link>
          ))}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={() => setSearchOpen(s => !s)} style={{ background:"rgba(255,255,255,.08)",border:"none",borderRadius:10,padding:"8px 12px",cursor:"pointer",color:"rgba(255,255,255,.75)",fontSize:16,lineHeight:1,display:"flex",alignItems:"center" }}>🔍</button>
          <Link to="/login" className="hidden md:inline-flex" style={{ color:"rgba(255,255,255,.8)",textDecoration:"none",fontSize:14,fontWeight:500,padding:"8px 14px",borderRadius:10,border:"1.5px solid rgba(255,255,255,.2)" }}>Đăng nhập</Link>
          <Link to="/register" className="hidden md:inline-flex" style={{ background:"var(--emerald)",color:"var(--navy)",textDecoration:"none",fontSize:14,fontWeight:700,padding:"8px 18px",borderRadius:10 }}>Đăng ký</Link>
          <button className="md:hidden" onClick={() => setMenuOpen(o => !o)} style={{ background:"rgba(255,255,255,.08)",border:"none",borderRadius:10,padding:"8px 12px",cursor:"pointer",color:"white",fontSize:18 }}>{menuOpen ? "✕" : "☰"}</button>
        </div>
      </nav>

      {searchOpen && (
        <div style={{ background:"var(--navy-2)",borderTop:"1px solid rgba(255,255,255,.07)",padding:"12px 24px 16px" }}>
          <div style={{ maxWidth:520,margin:"0 auto",position:"relative" }}>
            <span style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:15,pointerEvents:"none" }}>🔍</span>
            <input autoFocus type="text" placeholder="Tìm bộ flashcard, ngôn ngữ, chủ đề..."
              style={{ width:"100%",padding:"10px 16px 10px 42px",boxSizing:"border-box",border:"1.5px solid rgba(255,255,255,.15)",borderRadius:12,background:"rgba(255,255,255,.08)",color:"white",fontFamily:"'Outfit',sans-serif",fontSize:14,outline:"none" }} />
          </div>
        </div>
      )}

      {menuOpen && (
        <div style={{ background:"var(--navy-2)",borderTop:"1px solid rgba(255,255,255,.07)",padding:"12px 24px 20px" }}>
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
              style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 0",color:"rgba(255,255,255,.8)",textDecoration:"none",fontSize:15,fontWeight:500,borderBottom:"1px solid rgba(255,255,255,.06)" }}>
              {link.label}
              {link.badge && <span style={{ background:"var(--emerald)",color:"var(--navy)",fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:20 }}>{link.badge}</span>}
            </Link>
          ))}
          <div style={{ display:"flex",gap:12,marginTop:16 }}>
            <Link to="/login" onClick={() => setMenuOpen(false)} style={{ flex:1,textAlign:"center",padding:"11px",border:"1.5px solid rgba(255,255,255,.25)",borderRadius:10,color:"white",textDecoration:"none",fontSize:14,fontWeight:500 }}>Đăng nhập</Link>
            <Link to="/register" onClick={() => setMenuOpen(false)} style={{ flex:1,textAlign:"center",padding:"11px",background:"var(--emerald)",borderRadius:10,color:"var(--navy)",textDecoration:"none",fontSize:14,fontWeight:700 }}>Đăng ký</Link>
          </div>
        </div>
      )}
    </header>
  );
}