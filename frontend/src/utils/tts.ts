/**
 * tts.ts
 * Dùng Google Translate TTS qua Vite proxy → tránh CORS hoàn toàn
 * Logic y hệt tts-test.html đang hoạt động
 */

const LANG_MAP: Record<string, string> = {
  vi: "vi",
  en: "en",
  ja: "ja",
  fr: "fr",
  de: "de",
  ko: "ko",
  zh: "zh-CN",
};

/** Chuẩn hóa bất kỳ lang code → tl param cho Google TTS */
function normalizeToTL(lang: string): string {
  const code = (lang || "en").toLowerCase().split("-")[0];
  return LANG_MAP[code] ?? "en";
}

let currentAudio: HTMLAudioElement | null = null;

export function stopTTS(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
}

/**
 * Phát âm text qua Google Translate TTS
 * @param text     Nội dung cần đọc
 * @param lang     "vi" | "vi-VN" | "en" | "en-US" | "ja" | ...
 * @param speed    Tốc độ (mặc định 0.9)
 */
export function playGoogleTTS(text: string, lang: string, speed = 0.9): void {
  if (!text?.trim()) return;

  stopTTS();

  const tl = normalizeToTL(lang);
  console.log(`[TTS] text="${text}" tl="${tl}"`);

  // Dùng /tts-proxy thay vì gọi thẳng Google → Vite proxy sẽ forward, không bị CORS
  const url =
    `/tts-proxy/translate_tts` +
    `?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${tl}&client=gtx&ttsspeed=${speed}`;

  const audio = new Audio(url);
  currentAudio = audio;

  audio.oncanplaythrough = () => console.log("[TTS] Audio ready, đang phát");
  audio.onended = () => {
    console.log("[TTS] Phát xong");
    currentAudio = null;
  };
  audio.onerror = () => {
    console.warn(`[TTS] Lỗi code=${audio.error?.code}: ${audio.error?.message}`);
    currentAudio = null;
  };

  audio.play().catch((err) => {
    console.warn("[TTS] play() thất bại:", err);
    currentAudio = null;
  });
}