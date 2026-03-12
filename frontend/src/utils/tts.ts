/**
 * tts.ts — Web Speech API, không proxy, không CORS
 */

const LANG_MAP: Record<string, string> = {
  vi: "vi-VN", en: "en-US", ja: "ja-JP",
  fr: "fr-FR", de: "de-DE", ko: "ko-KR", zh: "zh-CN",
};

function normalizeLang(lang: string): string {
  const code = (lang || "en").toLowerCase().split("-")[0];
  return LANG_MAP[code] ?? "en-US";
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

/** Lấy danh sách voices — async vì lần đầu có thể chưa load */
function getVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    // Chờ voices load xong
    const handler = () => {
      resolve(window.speechSynthesis.getVoices());
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
    };
    window.speechSynthesis.addEventListener("voiceschanged", handler);
    // Timeout 1s nếu event không bao giờ fire
    setTimeout(() => {
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
      resolve(window.speechSynthesis.getVoices());
    }, 1000);
  });
}

export async function playGoogleTTS(text: string, lang: string, speed = 0.9): Promise<void> {
  if (!text?.trim()) return;

  stopTTS();

  if (typeof window === "undefined" || !window.speechSynthesis) {
    console.warn("[TTS] SpeechSynthesis không được hỗ trợ");
    return;
  }

  const bcp47 = normalizeLang(lang);
  console.log(`[TTS] Speaking text="${text}" lang="${bcp47}"`);

  const voices = await getVoices();
  const langPrefix = bcp47.split("-")[0];

  // Ưu tiên voice khớp chính xác (vd: vi-VN), sau đó khớp prefix (vi)
  const voice =
    voices.find((v) => v.lang === bcp47) ??
    voices.find((v) => v.lang.startsWith(langPrefix)) ??
    null;

  if (!voice) {
    console.warn(`[TTS] Không tìm thấy voice cho "${bcp47}". Voices có sẵn:`, voices.map(v => v.lang));
  }

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang  = bcp47;
  utter.rate  = speed;
  utter.pitch = 1;
  if (voice) utter.voice = voice;

  utter.onerror = (e) => {
    // "interrupted" là do chính stopTTS() gây ra — bỏ qua, không phải lỗi thật
    if (e.error === "interrupted" || e.error === "canceled") return;
    console.warn("[TTS] Lỗi:", e.error);
  };

  window.speechSynthesis.speak(utter);
}