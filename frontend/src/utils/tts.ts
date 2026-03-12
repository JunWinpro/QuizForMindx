/**
 * tts.ts
 * Dùng Web Speech API (SpeechSynthesis) — native, không cần proxy, không CORS.
 * Fallback sang Google Translate TTS URL trực tiếp nếu browser không hỗ trợ.
 */

const LANG_MAP: Record<string, string> = {
  vi: "vi-VN",
  en: "en-US",
  ja: "ja-JP",
  fr: "fr-FR",
  de: "de-DE",
  ko: "ko-KR",
  zh: "zh-CN",
};

const GOOGLE_LANG_MAP: Record<string, string> = {
  vi: "vi",
  en: "en",
  ja: "ja",
  fr: "fr",
  de: "de",
  ko: "ko",
  zh: "zh-CN",
};

/** Chuẩn hóa lang code → BCP-47 cho SpeechSynthesis */
function normalizeLang(lang: string): string {
  const code = (lang || "en").toLowerCase().split("-")[0];
  return LANG_MAP[code] ?? "en-US";
}

/** Chuẩn hóa lang code → tl param cho Google TTS */
function normalizeToTL(lang: string): string {
  const code = (lang || "en").toLowerCase().split("-")[0];
  return GOOGLE_LANG_MAP[code] ?? "en";
}

let currentUtterance: SpeechSynthesisUtterance | null = null;
let currentAudio: HTMLAudioElement | null = null;

export function stopTTS(): void {
  // Dừng Web Speech API
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
  // Dừng Audio fallback
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
}

/**
 * Phát âm text — ưu tiên Web Speech API, fallback sang Google TTS trực tiếp
 * @param text   Nội dung cần đọc
 * @param lang   "vi" | "vi-VN" | "en" | "en-US" | "ja" | ...
 * @param speed  Tốc độ (mặc định 0.9)
 */
export function playGoogleTTS(text: string, lang: string, speed = 0.9): void {
  if (!text?.trim()) return;

  stopTTS();

  // ── Ưu tiên Web Speech API ──────────────────────────────────────────────
  if (window.speechSynthesis) {
    const bcp47 = normalizeLang(lang);
    console.log(`[TTS] SpeechSynthesis text="${text}" lang="${bcp47}"`);

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = bcp47;
    utter.rate = speed;
    utter.pitch = 1;

    // Chọn voice phù hợp ngôn ngữ nếu có
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find(v => v.lang.startsWith(bcp47.split("-")[0]));
    if (match) utter.voice = match;

    utter.onend   = () => { currentUtterance = null; };
    utter.onerror = (e) => {
      console.warn("[TTS] SpeechSynthesis lỗi:", e.error);
      currentUtterance = null;
      // Fallback nếu lỗi
      playDirectGoogleTTS(text, lang, speed);
    };

    currentUtterance = utter;
    window.speechSynthesis.speak(utter);
    return;
  }

  // ── Fallback: Google Translate TTS trực tiếp (không qua proxy) ──────────
  playDirectGoogleTTS(text, lang, speed);
}

/** Gọi thẳng Google Translate TTS (fallback khi không có SpeechSynthesis) */
function playDirectGoogleTTS(text: string, lang: string, speed: number): void {
  const tl = normalizeToTL(lang);
  console.log(`[TTS] Google Direct text="${text}" tl="${tl}"`);

  const url =
    `https://translate.googleapis.com/translate_tts` +
    `?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${tl}&client=gtx&ttsspeed=${speed}`;

  const audio = new Audio(url);
  audio.crossOrigin = "anonymous";
  currentAudio = audio;

  audio.onended = () => { currentAudio = null; };
  audio.onerror = () => {
    console.warn("[TTS] Google Direct TTS thất bại — thử Web Speech lần cuối");
    currentAudio = null;
    // Last resort: Web Speech nếu chưa thử
    if (window.speechSynthesis) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = normalizeLang(lang);
      window.speechSynthesis.speak(utter);
    }
  };

  audio.play().catch((err) => {
    console.warn("[TTS] Audio play() thất bại:", err);
    currentAudio = null;
  });
}