/**
 * tts.ts — Web Speech API only, không proxy, không CORS
 */

const LANG_MAP: Record<string, string> = {
  vi: "vi-VN", en: "en-US", ja: "ja-JP",
  fr: "fr-FR", de: "de-DE", ko: "ko-KR", zh: "zh-CN",
};

function normalizeLang(lang: string): string {
  const code = (lang || "en").toLowerCase().split("-")[0];
  return LANG_MAP[code] ?? "en-US";
}

export function stopTTS(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

function getVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) { resolve(voices); return; }
    const handler = () => {
      resolve(window.speechSynthesis.getVoices());
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
    };
    window.speechSynthesis.addEventListener("voiceschanged", handler);
    setTimeout(() => {
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
      resolve(window.speechSynthesis.getVoices());
    }, 1500);
  });
}

export async function playGoogleTTS(text: string, lang: string, speed = 0.9): Promise<void> {
  if (!text?.trim()) return;
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  // Hủy utterance đang phát (nếu có) trước khi phát mới
  window.speechSynthesis.cancel();

  // Chờ một tick để cancel() hoàn tất — tránh lỗi "interrupted"
  await new Promise((r) => setTimeout(r, 50));

  const bcp47 = normalizeLang(lang);
  const voices = await getVoices();
  const langPrefix = bcp47.split("-")[0];

  const voice =
    voices.find((v) => v.lang === bcp47) ??
    voices.find((v) => v.lang.startsWith(langPrefix)) ??
    null;

  console.log(`[TTS] Speaking "${text}" lang=${bcp47} voice=${voice?.name ?? "default"}`);

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang  = bcp47;
  utter.rate  = speed;
  utter.pitch = 1;
  if (voice) utter.voice = voice;

  utter.onerror = (e) => {
    // interrupted/canceled là bình thường khi stopTTS() hoặc phát liên tiếp
    if (e.error === "interrupted" || e.error === "canceled") return;
    console.warn("[TTS] Lỗi:", e.error);
  };

  window.speechSynthesis.speak(utter);
}