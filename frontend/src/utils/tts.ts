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

function normalizeLang(lang: string): string {
  const code = (lang || "en").toLowerCase().split("-")[0];
  return LANG_MAP[code] ?? "en-US";
}

function normalizeToTL(lang: string): string {
  const code = (lang || "en").toLowerCase().split("-")[0];
  return GOOGLE_LANG_MAP[code] ?? "en";
}

let currentAudio: HTMLAudioElement | null = null;

export function stopTTS(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
}

export function playGoogleTTS(text: string, lang: string, speed = 0.9): void {
  if (!text?.trim()) return;

  stopTTS();

  if (typeof window !== "undefined" && window.speechSynthesis) {
    const bcp47 = normalizeLang(lang);
    console.log(`[TTS] SpeechSynthesis text="${text}" lang="${bcp47}"`);

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = bcp47;
    utter.rate = speed;
    utter.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const match = voices.find((v) => v.lang.startsWith(bcp47.split("-")[0]));
    if (match) utter.voice = match;

    utter.onerror = (e) => {
      console.warn("[TTS] SpeechSynthesis lỗi:", e.error);
      playDirectGoogleTTS(text, lang, speed);
    };

    window.speechSynthesis.speak(utter);
    return;
  }

  playDirectGoogleTTS(text, lang, speed);
}

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
    console.warn("[TTS] Google Direct TTS thất bại");
    currentAudio = null;
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