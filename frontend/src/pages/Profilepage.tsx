import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

function Toast({ msg, type }: { msg:string; type:"success"|"error" }) {
  return (
    <div style={{ position:"fixed",top:20,right:20,zIndex:9999,background:type==="success"?"#00c896":"#FF6B6B",color:type==="success"?"var(--navy)":"white",padding:"14px 20px",borderRadius:12,fontWeight:600,fontSize:14,boxShadow:"0 4px 20px rgba(0,0,0,.25)",maxWidth:320 }}>
      {msg}
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ displayName: user?.displayName||"" });
  const [pwForm, setPwForm] = useState({ currentPassword:"", newPassword:"", confirmPassword:"" });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [toast, setToast] = useState<{ msg:string; type:"success"|"error" }|null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [pwErrors, setPwErrors] = useState<Record<string,string>>({});
  const [tab, setTab] = useState<"profile"|"security">("profile");

  const showToast = (msg:string, type:"success"|"error"="success") => {
    setToast({ msg, type });
    setTimeout(()=>setToast(null), 3200);
  };

  if (!user) { navigate("/login"); return null; }

  const initials = user.displayName
    ? user.displayName.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase()
    : "?";

  const handleUpdateProfile = async () => {
    if (!form.displayName.trim()) return;
    setSaving(true);
    try {
      const res = await api.put("/auth/me", { displayName: form.displayName });
      if (res.data?.success) {
        login(localStorage.getItem("token")!, res.data.data);
        showToast("Cập nhật thành công! ✅");
      }
    } catch (err:any) { showToast(err?.response?.data?.message||"Cập nhật thất bại","error"); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    const errs: Record<string,string> = {};
    if (!pwForm.currentPassword) errs.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
    if (pwForm.newPassword.length<6) errs.newPassword = "Tối thiểu 6 ký tự";
    if (pwForm.newPassword!==pwForm.confirmPassword) errs.confirmPassword = "Mật khẩu không khớp";
    setPwErrors(errs);
    if (Object.keys(errs).length>0) return;
    setSavingPw(true);
    try {
      const res = await api.put("/auth/change-password", { currentPassword:pwForm.currentPassword, newPassword:pwForm.newPassword });
      if (res.data?.success) {
        setPwForm({ currentPassword:"",newPassword:"",confirmPassword:"" });
        setPwErrors({});
        showToast("Đổi mật khẩu thành công! 🔐");
      }
    } catch (err:any) { showToast(err?.response?.data?.message||"Đổi mật khẩu thất bại","error"); }
    finally { setSavingPw(false); }
  };

  return (
    <div style={{ maxWidth:800, margin:"0 auto", padding:"40px 24px" }}>
      {toast && <Toast {...toast}/>}

      <div className="animate-fade-up" style={{ marginBottom:32 }}>
        <h1 style={{ fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:"clamp(24px,4vw,34px)",color:"var(--navy)",marginBottom:6 }}>Hồ sơ cá nhân</h1>
        <p style={{ color:"var(--muted)",fontSize:15 }}>Quản lý thông tin tài khoản của bạn</p>
      </div>

      {/* Avatar card */}
      <div className="animate-fade-up stagger-1" style={{ background:"linear-gradient(135deg,var(--navy),var(--navy-2))",borderRadius:24,padding:"28px 32px",marginBottom:24,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap" }}>
        <div style={{ width:68,height:68,borderRadius:"50%",background:"var(--emerald)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:700,color:"var(--navy)",fontFamily:"'Fraunces',serif",flexShrink:0,boxShadow:"0 0 0 4px rgba(0,200,150,.25)" }}>
          {initials}
        </div>
        <div>
          <div style={{ fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:22,color:"white",marginBottom:4 }}>{user.displayName}</div>
          <div style={{ fontSize:14,color:"rgba(255,255,255,.55)" }}>{user.email}</div>
          {user.role && <div style={{ marginTop:8,display:"inline-block",background:"rgba(0,200,150,.15)",border:"1px solid rgba(0,200,150,.3)",borderRadius:20,padding:"3px 12px",fontSize:12,fontWeight:700,color:"var(--emerald)" }}>{user.role}</div>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex",gap:4,marginBottom:24,background:"var(--cream-2)",borderRadius:14,padding:4,width:"fit-content" }}>
        {[{key:"profile",label:"👤 Thông tin"},{key:"security",label:"🔐 Bảo mật"}].map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key as "profile"|"security")}
            style={{ padding:"9px 20px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:600,fontSize:14,transition:"all .2s",background:tab===t.key?"white":"transparent",color:tab===t.key?"var(--navy)":"var(--muted)",boxShadow:tab===t.key?"0 1px 8px rgba(0,0,0,.08)":"none" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab==="profile" && (
        <div className="animate-fade-up" style={{ background:"white",border:"1.5px solid var(--border)",borderRadius:24,padding:"32px 36px",marginBottom:24 }}>
          <h2 style={{ fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:20,color:"var(--navy)",marginBottom:24 }}>Thông tin cá nhân</h2>
          <div style={{ display:"flex",flexDirection:"column",gap:18 }}>
            <div>
              <label style={{ fontSize:13,fontWeight:600,color:"var(--text)",display:"block",marginBottom:6 }}>Họ và tên</label>
              <input type="text" value={form.displayName} onChange={e=>setForm(f=>({...f,displayName:e.target.value}))}
                className="input-field" style={{ width:"100%",boxSizing:"border-box" }}/>
            </div>
            <div>
              <label style={{ fontSize:13,fontWeight:600,color:"var(--text)",display:"block",marginBottom:6 }}>Email</label>
              <input type="email" value={user.email} disabled
                className="input-field" style={{ width:"100%",boxSizing:"border-box",opacity:0.6,cursor:"not-allowed" }}/>
              <p style={{ fontSize:12,color:"var(--muted)",marginTop:4 }}>Email không thể thay đổi</p>
            </div>
            <button onClick={handleUpdateProfile} disabled={saving||!form.displayName.trim()}
              style={{ padding:"13px",background:saving?"var(--cream-2)":"var(--navy)",color:saving?"var(--muted)":"white",border:"none",borderRadius:12,fontWeight:700,fontSize:15,cursor:saving?"not-allowed":"pointer",fontFamily:"'Outfit',sans-serif" }}>
              {saving?"Đang lưu...":"Lưu thay đổi ✅"}
            </button>
          </div>
        </div>
      )}

      {/* Security tab */}
      {tab==="security" && (
        <div className="animate-fade-up" style={{ background:"white",border:"1.5px solid var(--border)",borderRadius:24,padding:"32px 36px",marginBottom:24 }}>
          <h2 style={{ fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:20,color:"var(--navy)",marginBottom:24 }}>Đổi mật khẩu</h2>
          <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
            {[
              { key:"currentPassword", label:"Mật khẩu hiện tại",     placeholder:"••••••••" },
              { key:"newPassword",     label:"Mật khẩu mới",          placeholder:"Tối thiểu 6 ký tự" },
              { key:"confirmPassword", label:"Xác nhận mật khẩu mới", placeholder:"Nhập lại mật khẩu mới" },
            ].map(field=>(
              <div key={field.key}>
                <label style={{ fontSize:13,fontWeight:600,color:"var(--text)",display:"block",marginBottom:6 }}>{field.label}</label>
                <input type="password" value={(pwForm as any)[field.key]} placeholder={field.placeholder}
                  onChange={e=>setPwForm(f=>({...f,[field.key]:e.target.value}))}
                  className="input-field" style={{ width:"100%",boxSizing:"border-box",borderColor:pwErrors[field.key]?"#FF6B6B":undefined }}/>
                {pwErrors[field.key] && <p style={{ fontSize:12,color:"#FF6B6B",marginTop:4 }}>{pwErrors[field.key]}</p>}
              </div>
            ))}
            <button onClick={handleChangePassword} disabled={savingPw}
              style={{ padding:"13px",background:savingPw?"var(--cream-2)":"var(--navy)",color:savingPw?"var(--muted)":"white",border:"none",borderRadius:12,fontWeight:700,fontSize:15,cursor:savingPw?"not-allowed":"pointer",fontFamily:"'Outfit',sans-serif",marginTop:4 }}>
              {savingPw?"Đang lưu...":"Đổi mật khẩu 🔐"}
            </button>
          </div>
        </div>
      )}

      {/* Danger zone */}
      <div className="animate-fade-up stagger-3" style={{ border:"1.5px solid rgba(255,107,107,.3)",borderRadius:20,padding:"22px 28px" }}>
        <h3 style={{ fontWeight:700,fontSize:16,color:"#FF6B6B",marginBottom:6 }}>⚠️ Vùng nguy hiểm</h3>
        <p style={{ fontSize:14,color:"var(--muted)",marginBottom:16 }}>Đăng xuất khỏi tài khoản trên thiết bị này.</p>
        {!showLogoutConfirm ? (
          <button onClick={()=>setShowLogoutConfirm(true)}
            style={{ padding:"10px 24px",background:"rgba(255,107,107,.1)",color:"#FF6B6B",border:"1.5px solid rgba(255,107,107,.3)",borderRadius:10,fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:"'Outfit',sans-serif" }}>
            🚪 Đăng xuất
          </button>
        ) : (
          <div style={{ display:"flex",gap:10,alignItems:"center",flexWrap:"wrap" }}>
            <span style={{ fontSize:14,color:"var(--muted)" }}>Bạn chắc chắn muốn đăng xuất?</span>
            <button onClick={()=>{ logout(); navigate("/"); }}
              style={{ padding:"9px 20px",background:"#FF6B6B",color:"white",border:"none",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif" }}>
              Đăng xuất
            </button>
            <button onClick={()=>setShowLogoutConfirm(false)}
              style={{ padding:"9px 16px",background:"var(--cream-2)",color:"var(--text)",border:"none",borderRadius:10,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif" }}>
              Hủy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}