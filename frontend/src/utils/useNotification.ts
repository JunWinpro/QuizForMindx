import { useState, useCallback, useEffect } from "react";

type PermissionState = "default" | "granted" | "denied" | "unsupported";

interface UseNotificationReturn {
  permission: PermissionState;
  requestPermission: () => Promise<void>;
  notify: (title: string, options?: NotificationOptions) => void;
  isSupported: boolean;
}

/**
 * useNotification
 *
 * Quản lý Web Notification API.
 * - requestPermission(): xin quyền từ user
 * - notify(): hiển thị browser notification
 *
 * Dùng ở Navbar/StudyPage để nhắc ôn từ.
 */
export function useNotification(): UseNotificationReturn {
  const isSupported = typeof window !== "undefined" && "Notification" in window;

  const [permission, setPermission] = useState<PermissionState>(() => {
    if (!isSupported) return "unsupported";
    return Notification.permission as PermissionState;
  });

  // Sync permission state khi tab lấy lại focus
  useEffect(() => {
    if (!isSupported) return;
    const sync = () => setPermission(Notification.permission as PermissionState);
    window.addEventListener("focus", sync);
    return () => window.removeEventListener("focus", sync);
  }, [isSupported]);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return;
    const result = await Notification.requestPermission();
    setPermission(result as PermissionState);
  }, [isSupported]);

  const notify = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!isSupported || Notification.permission !== "granted") return;
      const n = new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options,
      });
      // Tự đóng sau 6 giây
      setTimeout(() => n.close(), 6000);
    },
    [isSupported]
  );

  return { permission, requestPermission, notify, isSupported };
}

/**
 * notifyDueCards(count, notify)
 * Tiện ích gửi thông báo "X từ cần ôn hôm nay"
 */
export function notifyDueCards(count: number, notify: (title: string, opts?: NotificationOptions) => void) {
  if (count <= 0) return;
  notify("📚 LexiLearn – Nhắc ôn từ vựng", {
    body: `Bạn có ${count} từ cần ôn hôm nay. Học ngay để duy trì streak! 🔥`,
    tag: "lexi-due-reminder", // tránh spam nhiều notification cùng tag
  });
}