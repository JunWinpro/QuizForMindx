import { useEffect, useRef, useState } from "react";
import { playGoogleTTS, stopTTS } from "../utils/tts";

interface AudioPlayerProps {
  audioUrl?: string;
  text?: string;       // text để TTS
  language?: string;   // "en" | "vi" | "ja" | "vi-VN" ... đều được
  size?: "sm" | "md";
}

export default function AudioPlayer({
  audioUrl, text, language = "en", size = "md",
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState(false);

  const btnSize  = size === "sm" ? 28 : 36;
  const iconSize = size === "sm" ? 12 : 15;

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
      stopTTS();
    };
  }, []);

  const handlePlay = async () => {
    setError(false);

    // Đang phát → dừng
    if (playing) {
      audioRef.current?.pause();
      audioRef.current = null;
      stopTTS();
      setPlaying(false);
      return;
    }

    // Ưu tiên audioUrl thật
    if (audioUrl) {
      setLoading(true);
      try {
        const audio = new Audio(audioUrl);
        audioRef.current  = audio;
        audio.onended     = () => setPlaying(false);
        audio.onerror     = () => { setLoading(false); setPlaying(false); fallbackTTS(); };
        await audio.play();
        setPlaying(true);
      } catch {
        fallbackTTS();
      } finally {
        setLoading(false);
      }
      return;
    }

    // Không có audioUrl → Google TTS
    fallbackTTS();
  };

  const fallbackTTS = () => {
    if (!text) return;
    setPlaying(true);
    // Truyền thẳng language vào, tts.ts sẽ tự normalize
    playGoogleTTS(text, language);
    // Không có callback onended nên reset sau 3s (safe)
    setTimeout(() => setPlaying(false), 3000);
  };

  if (!audioUrl && !text) return null;

  return (
    <button
      onClick={e => { e.stopPropagation(); handlePlay(); }}
      title={playing ? "Dừng" : "Phát âm"}
      style={{
        width: btnSize, height: btnSize,
        borderRadius: "50%", border: "none", cursor: "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, transition: "all .2s",
        background: playing ? "var(--emerald)" : error ? "rgba(255,107,107,.12)" : "rgba(0,200,150,.1)",
        color:      playing ? "var(--navy)"    : error ? "#FF6B6B"               : "var(--emerald-d)",
        boxShadow:  playing ? "0 0 0 4px rgba(0,200,150,.18)" : "none",
      }}
    >
      {loading ? (
        <span style={{ width: iconSize, height: iconSize, border: "2px solid var(--emerald)", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />
      ) : error ? (
        <span style={{ fontSize: iconSize }}>!</span>
      ) : playing ? (
        <svg width={iconSize} height={iconSize} viewBox="0 0 16 16" fill="currentColor">
          <rect x="3" y="2" width="4" height="12" rx="1"/>
          <rect x="9" y="2" width="4" height="12" rx="1"/>
        </svg>
      ) : (
        <svg width={iconSize} height={iconSize} viewBox="0 0 16 16" fill="currentColor">
          <path d="M9 2L5 6H2v4h3l4 4V2zm2.5 2.5a5 5 0 010 7 .5.5 0 01-.7-.7 4 4 0 000-5.6.5.5 0 01.7-.7z"/>
          <path d="M13.5 1.5a8 8 0 010 13 .5.5 0 01-.7-.7 7 7 0 000-11.6.5.5 0 01.7-.7z"/>
        </svg>
      )}
    </button>
  );
}