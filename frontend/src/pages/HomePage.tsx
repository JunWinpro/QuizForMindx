import { Link } from "react-router-dom";

function FeatureCard({ icon, title, desc }: { icon:string; title:string; desc:string }) {
  return (
    <div style={{ background:"white",border:"1.5px solid var(--border)",borderRadius:20,padding:"28px 24px" }}>
      <div style={{ width:48,height:48,borderRadius:14,background:"var(--cream-2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,marginBottom:16 }}>{icon}</div>
      <div style={{ fontWeight:700,fontSize:16,marginBottom:8,color:"var(--navy)" }}>{title}</div>
      <div style={{ fontSize:14,color:"var(--muted)",lineHeight:1.6 }}>{desc}</div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div>
      {/* ── Hero ── */}
      <section className="hero-bg" style={{ minHeight:"calc(100vh - 64px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"60px 24px",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,200,150,.06),transparent)",top:"-10%",left:"-5%",pointerEvents:"none" }}/>
        <div style={{ position:"absolute",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(245,166,35,.05),transparent)",bottom:"5%",right:"-5%",pointerEvents:"none" }}/>

        <div className="animate-fade-up" style={{ display:"inline-flex",alignItems:"center",gap:8,background:"rgba(0,200,150,.1)",border:"1px solid rgba(0,200,150,.3)",borderRadius:20,padding:"6px 16px",marginBottom:28,fontSize:13,fontWeight:600,color:"var(--emerald-d)" }}>
          ✨ Nền tảng học ngôn ngữ thông minh #1 Việt Nam
        </div>

        <h1 className="animate-fade-up stagger-1" style={{ fontFamily:"'Fraunces',serif",fontWeight:900,fontSize:"clamp(36px,6vw,72px)",lineHeight:1.08,color:"var(--navy)",marginBottom:20,letterSpacing:"-1.5px",maxWidth:800 }}>
          Học từ vựng <span style={{ color:"var(--emerald)" }}>thông minh</span>,<br/>nhớ mãi không quên
        </h1>

        <p className="animate-fade-up stagger-2" style={{ fontSize:"clamp(15px,2vw,18px)",color:"var(--muted)",marginBottom:40,maxWidth:520,lineHeight:1.7 }}>
          10.000+ từ vựng · 6 ngôn ngữ · Thuật toán spaced repetition · Theo dõi tiến trình mỗi ngày
        </p>

        <div className="animate-fade-up stagger-3" style={{ display:"flex",gap:14,flexWrap:"wrap",justifyContent:"center" }}>
          <Link to="/decks" style={{ background:"var(--navy)",color:"white",padding:"14px 32px",borderRadius:14,fontWeight:700,fontSize:15,border:"none",cursor:"pointer",boxShadow:"0 8px 30px rgba(13,27,42,.18)",display:"inline-flex",alignItems:"center",gap:8,textDecoration:"none" }}>
            🚀 Bắt đầu học ngay
          </Link>
          <Link to="/study" style={{ background:"transparent",color:"var(--navy)",padding:"14px 32px",borderRadius:14,fontWeight:600,fontSize:15,border:"2px solid var(--border)",display:"inline-flex",alignItems:"center",gap:8,textDecoration:"none" }}>
            ▶ Xem demo
          </Link>
        </div>

        {/* Floating demo card */}
        <div className="animate-fade-up stagger-4 animate-float" style={{ marginTop:56,background:"white",borderRadius:20,padding:"24px 32px",boxShadow:"var(--shadow-lg)",border:"1.5px solid var(--border)",display:"inline-block",textAlign:"center",minWidth:220 }}>
          <div style={{ fontSize:11,fontWeight:700,letterSpacing:"0.08em",color:"var(--muted)",textTransform:"uppercase",marginBottom:12 }}>Từ hôm nay</div>
          <div style={{ fontFamily:"'Fraunces',serif",fontSize:28,fontWeight:700,color:"var(--navy)",marginBottom:6 }}>Ubiquitous</div>
          <div style={{ fontSize:13,color:"var(--muted)",fontStyle:"italic" }}>/juːˈbɪk.wɪ.təs/</div>
          <div style={{ marginTop:12,fontSize:14,color:"var(--text)",background:"var(--cream)",borderRadius:8,padding:"8px 14px" }}>Hiện diện khắp nơi</div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section style={{ background:"var(--navy)",padding:"56px 24px" }}>
        <div style={{ maxWidth:1200,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:20 }}>
          {[
            { icon:"📚", value:"10K+",  label:"Từ vựng"  },
            { icon:"🌍", value:"6",     label:"Ngôn ngữ" },
            { icon:"👥", value:"50K+", label:"Học viên" },
            { icon:"⭐", value:"4.9",  label:"Đánh giá" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign:"center",padding:"12px" }}>
              <div style={{ fontSize:28,marginBottom:8 }}>{s.icon}</div>
              <div style={{ fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:32,color:"var(--emerald)",lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:13,color:"rgba(255,255,255,.6)",marginTop:6,fontWeight:500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding:"80px 24px",maxWidth:1200,margin:"0 auto" }}>
        <div style={{ textAlign:"center",marginBottom:52 }}>
          <div style={{ fontSize:12,fontWeight:700,letterSpacing:"0.1em",color:"var(--emerald)",textTransform:"uppercase",marginBottom:12 }}>Tính năng</div>
          <h2 style={{ fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:"clamp(26px,4vw,40px)",color:"var(--navy)",marginBottom:14 }}>Thiết kế cho người học nghiêm túc</h2>
          <p style={{ fontSize:16,color:"var(--muted)",maxWidth:500,margin:"0 auto" }}>Kết hợp khoa học thần kinh và gamification để tối ưu hóa quá trình ghi nhớ.</p>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:24 }}>
          <FeatureCard icon="🧠" title="Spaced Repetition"    desc="Thuật toán SM-2 tự động lên lịch ôn tập đúng lúc bạn sắp quên." />
          <FeatureCard icon="🎯" title="Luyện tập thích nghi" desc="Hệ thống điều chỉnh độ khó dựa trên hiệu suất của bạn." />
          <FeatureCard icon="📊" title="Phân tích tiến trình"  desc="Dashboard chi tiết theo dõi streak, accuracy và vocab growth." />
          <FeatureCard icon="🎮" title="Gamification"          desc="Điểm XP, huy hiệu, bảng xếp hạng giúp việc học thú vị." />
          <FeatureCard icon="🔊" title="Phát âm chuẩn"         desc="Nghe phát âm từ người bản xứ với 6 ngôn ngữ." />
          <FeatureCard icon="✍️" title="Tạo deck cá nhân"      desc="Tự tạo bộ flashcard từ nội dung bạn muốn học." />
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ margin:"0 24px 80px",borderRadius:28,background:"linear-gradient(135deg,var(--navy),var(--navy-2))",padding:"60px 40px",textAlign:"center",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",top:-60,right:-60,width:200,height:200,borderRadius:"50%",background:"rgba(0,200,150,.08)",pointerEvents:"none" }}/>
        <h2 style={{ fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:"clamp(24px,4vw,38px)",color:"white",marginBottom:14 }}>Bắt đầu hành trình ngôn ngữ của bạn</h2>
        <p style={{ fontSize:16,color:"rgba(255,255,255,.65)",marginBottom:36 }}>Miễn phí · Không cần thẻ tín dụng · Học ngay hôm nay</p>
        <Link to="/register" style={{ background:"var(--emerald)",color:"var(--navy)",padding:"14px 40px",borderRadius:14,fontWeight:700,fontSize:16,textDecoration:"none",display:"inline-block",boxShadow:"0 8px 30px rgba(0,200,150,.3)" }}>
          Đăng ký miễn phí 🎉
        </Link>
      </section>
    </div>
  );
}