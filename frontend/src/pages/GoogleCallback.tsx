/**
 * src/pages/GoogleCallback.tsx
 *
 * Trang nhận redirect từ Google OAuth callback.
 * URL: /auth/callback?token=xxx&user={...}
 */

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const userRaw = searchParams.get("user");
    const err = searchParams.get("error");

    if (err || !token || !userRaw) {
      setError("Đăng nhập Google thất bại. Vui lòng thử lại.");
      setTimeout(() => navigate("/login"), 3000);
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userRaw));
      login(token, user);
      navigate("/decks", { replace: true });
    } catch {
      setError("Dữ liệu người dùng không hợp lệ.");
      setTimeout(() => navigate("/login"), 3000);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div style={{
        minHeight: "80vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16,
      }}>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <p style={{ color: "#FF6B6B", fontWeight: 600 }}>{error}</p>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>Đang chuyển về trang đăng nhập...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "80vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16,
    }}>
      <div style={{
        width: 48, height: 48,
        border: "3px solid rgba(0,200,150,.2)",
        borderTopColor: "var(--emerald)",
        borderRadius: "50%",
        animation: "spin .7s linear infinite",
      }} />
      <p style={{ color: "var(--muted)", fontSize: 15 }}>Đang đăng nhập với Google...</p>
    </div>
  );
}