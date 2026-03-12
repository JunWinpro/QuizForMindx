/**
 * tts.ts
 * Google Translate TTS — không dùng crossOrigin để tránh CORS block
 * Fallback: Web Speech API
 */

const LANG_MAP: Record<string, string> = {
  vi: "vi-VN", en: "en-US", ja: "ja-JP",
  fr: "fr-FR", de: "de-DE", ko: "ko-KR", zh: "zh-CN",
};

const GOOGLE_LANG_MAP: Record<string, string> = {
  vi: "vi", en: "en", ja: "ja",
  fr: "fr", de: "de", ko: "ko", zh: "zh-CN",
};

function getLangCode(lang: string): string {
  return (lang || "en").toLowerCase().split("-")[0];
}

let currentAudio: HTMLAudioElement | null = null;

export function stopTTS(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function playGoogleTTS(text: string, lang: string, speed = 0.9): void {
  if (!text?.trim()) return;

  stopTTS();

  const code = getLangCode(lang);
  const tl   = GOOGLE_LANG_MAP[code] ?? "en";

  // KHÔNG đặt crossOrigin — audio tag load cross-origin bình thường
  const url =
    `https://translate.google.com/translate_tts` +
    `?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${tl}&client=tw-ob&ttsspeed=${speed}`;

  console.log(`[TTS] Google Translate "${text}" tl="${tl}"`);

  const audio = new Audio(url);
  // Không set audio.crossOrigin
  currentAudio = audio;

  audio.onended = () => { currentAudio = null; };

  audio.onerror = () => {
    console.warn("[TTS] Google TTS thất bại, fallback Web Speech");
    currentAudio = null;
    fallbackWebSpeech(text, lang, speed);
  };

  audio.play().catch(() => {
    currentAudio = null;
    fallbackWebSpeech(text, lang, speed);
  });
}

function fallbackWebSpeech(text: string, lang: string, speed: number): void {
  if (!window.speechSynthesis) return;
  const code  = getLangCode(lang);
  const bcp47 = LANG_MAP[code] ?? "en-US";
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang  = bcp47;
  utter.rate  = speed;
  utter.onerror = (e) => {
    if (e.error === "interrupted" || e.error === "canceled") return;
    console.warn("[TTS] WebSpeech lỗi:", e.error);
  };
  window.speechSynthesis.speak(utter);
}