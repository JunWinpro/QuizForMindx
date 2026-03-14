import { useEffect, useRef, useState } from "react";
import { playGoogleTTS, stopTTS } from "../utils/tts";

interface AudioPlayerProps {
  audioUrl?: string;
  text?: string;      // text để TTS
  language?: string;  // "en" | "vi" | "ja" | "vi-VN" ... đều được
  size?: "sm" | "md";
}

export default function AudioPlayer({
  audioUrl,
  text,
  language = "en",
  size = "md",
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef(false); // tránh setState sau khi unmount

  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(false);

  const btnSize  = size === "sm" ? 28 : 36;
  const iconSize = size === "sm" ? 12 : 15;

  // Cleanup khi unmount
  useEffect(() => {
    abortRef.current = false;
    return () => {
      abortRef.current = true;
      audioRef.current?.pause();
      audioRef.current = null;
      stopTTS();
    };
  }, []);

  // ── Dừng tất cả ─────────────────────────────────────────────────────────
  const stopAll = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    stopTTS();
    if (!abortRef.current) {
      setPlaying(false);
      setLoading(false);
    }
  };

  // ── Click handler ────────────────────────────────────────────────────────
  const handlePlay = async () => {
    setError(false);

    // Đang phát hoặc loading → dừng
    if (playing || loading) {
      stopAll();
      return;
    }

    // Ưu tiên audioUrl thật
    if (audioUrl) {
      setLoading(true);
      try {
        const audio      = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          if (!abortRef.current) setPlaying(false);
        };
        audio.onerror = () => {
          if (abortRef.current) return;
          setLoading(false);
          setPlaying(false);
          runTTS(); // fallback sang TTS nếu URL lỗi
        };

        await audio.play();
        if (!abortRef.current) { setLoading(false); setPlaying(true); }
      } catch {
        if (!abortRef.current) { setLoading(false); runTTS(); }
      }
      return;
    }

    // Không có audioUrl → TTS
    runTTS();
  };

  // ── Gọi TTS (async) ──────────────────────────────────────────────────────
  const runTTS = async () => {
    if (!text || abortRef.current) return;

    setLoading(true);
    try {
      if (!abortRef.current) { setLoading(false); setPlaying(true); }
      await playGoogleTTS(text, language); // Promise — tự resolve khi audio kết thúc
    } catch {
      if (!abortRef.current) setError(true);
    } finally {
      if (!abortRef.current) setPlaying(false);
    }
  };

  if (!audioUrl && !text) return null;

  return (
    <button
      onClick={e => { e.stopPropagation(); handlePlay(); }}
      title={playing ? "Dừng" : "Phát âm"}
      style={{
        width:        btnSize,
        height:       btnSize,
        borderRadius: "50%",
        border:       "none",
        cursor:       "pointer",
        display:      "inline-flex",
        alignItems:   "center",
        justifyContent: "center",
        flexShrink:   0,
        transition:   "all .2s",
        background:   playing
          ? "var(--emerald)"
          : error
          ? "rgba(255,107,107,.12)"
          : "rgba(0,200,150,.1)",
        color: playing
          ? "var(--navy)"
          : error
          ? "#FF6B6B"
          : "var(--emerald-d)",
        boxShadow: playing ? "0 0 0 4px rgba(0,200,150,.18)" : "none",
      }}
    >
      {loading ? (
        // Spinner — đang fetch FPT.AI hoặc load audio
        <span
          style={{
            width:        iconSize,
            height:       iconSize,
            border:       "2px solid var(--emerald)",
            borderTopColor: "transparent",
            borderRadius: "50%",
            display:      "inline-block",
            animation:    "spin .7s linear infinite",
          }}
        />
      ) : error ? (
        <span style={{ fontSize: iconSize }}>!</span>
      ) : playing ? (
        // Pause icon
        <svg width={iconSize} height={iconSize} viewBox="0 0 16 16" fill="currentColor">
          <rect x="3" y="2" width="4" height="12" rx="1" />
          <rect x="9" y="2" width="4" height="12" rx="1" />
        </svg>
      ) : (
        // Speaker icon
        <svg width={iconSize} height={iconSize} viewBox="0 0 16 16" fill="currentColor">
          <path d="M9 2L5 6H2v4h3l4 4V2zm2.5 2.5a5 5 0 010 7 .5.5 0 01-.7-.7 4 4 0 000-5.6.5.5 0 01.7-.7z" />
          <path d="M13.5 1.5a8 8 0 010 13 .5.5 0 01-.7-.7 7 7 0 000-11.6.5.5 0 01.7-.7z" />
        </svg>
      )}
    </button>
  );
}