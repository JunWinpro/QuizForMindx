/**
 * OfflineIndicator
 * Shows a banner when the user is offline.
 * Also shows a pending-sync message if there are queued writes.
 */

import { useState, useEffect } from "react";
import { getQueueCount } from "../utils/indexedDB";

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueCount, setQueueCount] = useState(0);
  const [visible, setVisible] = useState(!navigator.onLine);

  // Poll queue count every 5s when offline
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const refresh = async () => {
      const count = await getQueueCount();
      setQueueCount(count);
    };

    if (!isOnline) {
      refresh();
      interval = setInterval(refresh, 5000);
    } else {
      setQueueCount(0);
    }

    return () => { if (interval) clearInterval(interval); };
  }, [isOnline]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Keep banner briefly visible to show "syncing" then hide
      setTimeout(() => setVisible(false), 2500);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setVisible(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        animation: "fadeIn .3s ease",
        pointerEvents: "none",
      }}
    >
      {/* Main banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 20px",
          borderRadius: 14,
          fontSize: 13,
          fontWeight: 700,
          fontFamily: "'Outfit', sans-serif",
          boxShadow: "0 8px 30px rgba(0,0,0,.25)",
          whiteSpace: "nowrap",
          background: isOnline
            ? "linear-gradient(135deg, #00c896, #00a87f)"
            : "linear-gradient(135deg, #1a1a2e, #0D1B2A)",
          color: isOnline ? "var(--navy, #0D1B2A)" : "white",
          border: isOnline
            ? "1.5px solid rgba(0,200,150,.4)"
            : "1.5px solid rgba(255,255,255,.1)",
          transition: "all .4s ease",
        }}
      >
        <span style={{ fontSize: 16 }}>{isOnline ? "✅" : "📡"}</span>
        {isOnline
          ? "Đã kết nối lại — đang đồng bộ..."
          : "Offline — Flashcard đang dùng từ cache"}
      </div>

      {/* Pending writes sub-banner */}
      {!isOnline && queueCount > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 16px",
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "'Outfit', sans-serif",
            background: "rgba(245,166,35,.12)",
            border: "1.5px solid rgba(245,166,35,.3)",
            color: "#D4890A",
            boxShadow: "0 4px 16px rgba(0,0,0,.15)",
          }}
        >
          <span>🕐</span>
          {queueCount} thay đổi sẽ đồng bộ khi có kết nối
        </div>
      )}
    </div>
  );
}
