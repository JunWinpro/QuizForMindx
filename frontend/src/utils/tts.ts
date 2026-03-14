/**
 * tts.ts — MIỄN PHÍ hoàn toàn
 *
 * Chiến lược:
 *  - Tiếng Việt (vi)  → FPT.AI TTS  (miễn phí 3.000 ký tự/ngày)
 *  - Ngôn ngữ khác    → Web Speech API (built-in trình duyệt, 40+ ngôn ngữ)
 *  - Fallback cuối    → Web Speech API (nếu FPT.AI lỗi / thiếu key)
 *
 * Setup:
 *  1. Đăng ký miễn phí tại https://fpt.ai/tts → lấy API Key
 *  2. Thêm vào frontend/.env:  VITE_FPT_TTS_API_KEY=your_key_here
 */

// ── BCP-47 language codes ────────────────────────────────────────────────

const LANG_BCP47: Record<string, string> = {
  vi: "vi-VN",
  en: "en-US",
  ja: "ja-JP",
  fr: "fr-FR",
  de: "de-DE",
  ko: "ko-KR",
  zh: "zh-CN",
};

// ── FPT.AI config ─────────────────────────────────────────────────────────
// Giọng có thể đổi: "banmai" | "leminh" | "lannhi" | "minhquang"
const FPT_VOICE = "banmai"; // nữ miền Nam
const FPT_SPEED = "";       // "" bình thường | "-1" chậm | "1" nhanh

// FPT trả URL async — file mp3 cần vài ms để generate xong
// Retry tối đa MAX_RETRY lần, mỗi lần cách nhau RETRY_DELAY ms
const MAX_RETRY   = 4;
const RETRY_DELAY = 600; // ms

// ── Audio state ───────────────────────────────────────────────────────────

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

// ── Main: playGoogleTTS ───────────────────────────────────────────────────
// Giữ tên cũ để không phải đổi import ở AudioPlayer.tsx

export async function playGoogleTTS(
  text: string,
  lang: string,
  speed = 1.0,
): Promise<void> {
  if (!text?.trim()) return;
  stopTTS();

  const code = getLangCode(lang);

  // Tiếng Việt → FPT.AI
  if (code === "vi") {
    const apiKey = import.meta.env.VITE_FPT_TTS_API_KEY as string | undefined;
    if (apiKey?.trim()) {
      try {
        return await playFptTTS(text, apiKey.trim());
      } catch (err) {
        console.warn("[TTS] FPT.AI thất bại, chuyển sang Web Speech:", err);
      }
    } else {
      console.info("[TTS] Chưa có VITE_FPT_TTS_API_KEY → dùng Web Speech API");
    }
  }

  // Ngôn ngữ khác / fallback → Web Speech API
  return webSpeech(text, code, speed);
}

// ── FPT.AI TTS ────────────────────────────────────────────────────────────

async function playFptTTS(text: string, apiKey: string): Promise<void> {
  const res = await fetch("https://api.fpt.ai/hmi/tts/v5", {
    method: "POST",
    headers: {
      "api-key":      apiKey,
      "voice":        FPT_VOICE,
      "speed":        FPT_SPEED,
      "Content-Type": "text/plain", // plain text, KHÔNG dùng JSON
    },
    body: text, // gửi thẳng text, KHÔNG JSON.stringify
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`FPT.AI HTTP ${res.status}: ${msg}`);
  }

  const data = await res.json() as {
    error:    number;
    async?:   string; // URL mp3 — file chưa sẵn sàng ngay lập tức
    message?: string;
  };

  if (data.error !== 0 || !data.async) {
    throw new Error(`FPT.AI error ${data.error}: ${data.message ?? "no audio url"}`);
  }

  // FIX: FPT.AI trả URL async — mp3 cần thời gian generate.
  // Đợi RETRY_DELAY ms rồi mới play, retry nếu load thất bại.
  await delay(RETRY_DELAY);
  await playAudioUrlWithRetry(data.async, MAX_RETRY);
}

// ── Play audio từ URL, tự retry nếu chưa sẵn sàng ───────────────────────

async function playAudioUrlWithRetry(url: string, retriesLeft: number): Promise<void> {
  try {
    await playAudioUrl(url);
  } catch (err) {
    if (retriesLeft <= 0) {
      throw err; // hết lần retry → ném lỗi lên để fallback Web Speech
    }
    console.info(`[TTS] Audio chưa sẵn sàng, thử lại... (còn ${retriesLeft} lần)`);
    await delay(RETRY_DELAY);
    return playAudioUrlWithRetry(url, retriesLeft - 1);
  }
}

// ── Play audio từ URL → Promise resolve khi xong ─────────────────────────

function playAudioUrl(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    currentAudio = audio;

    audio.onended = () => {
      currentAudio = null;
      resolve();
    };
    audio.onerror = () => {
      currentAudio = null;
      reject(new Error("Audio load error"));
    };
    audio.play().catch((e) => {
      currentAudio = null;
      reject(e);
    });
  });
}

// ── Web Speech API ────────────────────────────────────────────────────────

function webSpeech(text: string, code: string, speed: number): Promise<void> {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return; }

    const bcp47 = LANG_BCP47[code] ?? "en-US";

    const speak = () => {
      const utter  = new SpeechSynthesisUtterance(text);
      utter.lang   = bcp47;
      utter.rate   = speed;

      // Ưu tiên exact match trước (vi-VN), rồi mới partial (vi)
      const voices  = window.speechSynthesis.getVoices();
      const exact   = voices.find(v => v.lang === bcp47);
      const partial = voices.find(v => v.lang.startsWith(code));
      if (exact || partial) utter.voice = (exact ?? partial)!;

      utter.onend   = () => resolve();
      utter.onerror = (e) => {
        if (e.error !== "interrupted" && e.error !== "canceled") {
          console.warn("[TTS] Web Speech lỗi:", e.error);
        }
        resolve();
      };

      window.speechSynthesis.speak(utter);
    };

    // Voices có thể chưa load xong khi gọi lần đầu
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      speak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        speak();
      };
      // Timeout an toàn nếu onvoiceschanged không trigger
      setTimeout(() => {
        if (window.speechSynthesis.getVoices().length === 0) speak();
      }, 500);
    }
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────

function getLangCode(lang: string): string {
  return (lang || "en").toLowerCase().split("-")[0];
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}