import { useEffect, useRef, useState } from "react";

interface AudioPlayerProps {
  audioUrl?: string;
  text?: string;          // fallback TTS text
  language?: string;      // e.g. "en", "ja", "fr"
  size?: "sm" | "md";
}

const LANG_TTS: Record<string, string> = {
  en: "en-US", ja: "ja-JP", fr: "fr-FR",
  zh: "zh-CN", de: "de-DE", ko: "ko-KR",
  vi: "vi-VN",
};

export default function AudioPlayer({ audioUrl, text, language = "en", size = "md" }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(false);

  const btnSize = size === "sm" ? 28 : 36;
  const iconSize = size === "sm" ? 12 : 15;

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  const playTTS = () => {
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = LANG_TTS[language] || "en-US";
    utter.rate = 0.9;
    utter.onstart = () => setPlaying(true);
    utter.onend   = () => setPlaying(false);
    utter.onerror = () => { setPlaying(false); setError(true); };
    window.speechSynthesis.speak(utter);
  };

  const handlePlay = async () => {
    setError(false);

    // If playing → stop
    if (playing) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
      window.speechSynthesis?.cancel();
      setPlaying(false);
      return;
    }

    // Use real audio URL
    if (audioUrl) {
      setLoading(true);
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio(audioUrl);
          audioRef.current.onended = () => setPlaying(false);
          audioRef.current.onerror = () => {
            setLoading(false); setPlaying(false);
            // Fallback TTS
            playTTS();
          };
        }
        await audioRef.current.play();
        setPlaying(true);
      } catch {
        playTTS();
      } finally {
        setLoading(false);
      }
      return;
    }

    // TTS fallback
    playTTS();
  };

  if (!audioUrl && !text) return null;

  return (
    <button
      onClick={e => { e.stopPropagation(); handlePlay(); }}
      title={playing ? "Dừng" : "Phát âm"}
      style={{
        width: btnSize, height: btnSize,
        borderRadius: "50%",
        border: "none",
        cursor: "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        transition: "all .2s",
        background: playing
          ? "var(--emerald)"
          : error
          ? "rgba(255,107,107,.12)"
          : "rgba(0,200,150,.1)",
        color: playing ? "var(--navy)" : error ? "#FF6B6B" : "var(--emerald-d)",
        boxShadow: playing ? "0 0 0 4px rgba(0,200,150,.18)" : "none",
      }}
    >
      {loading ? (
        <span style={{
          width: iconSize, height: iconSize,
          border: "2px solid var(--emerald)",
          borderTopColor: "transparent",
          borderRadius: "50%",
          display: "inline-block",
          animation: "spin .7s linear infinite",
        }} />
      ) : error ? (
        <span style={{ fontSize: iconSize }}>!</span>
      ) : playing ? (
        // Pause icon
        <svg width={iconSize} height={iconSize} viewBox="0 0 16 16" fill="currentColor">
          <rect x="3" y="2" width="4" height="12" rx="1"/>
          <rect x="9" y="2" width="4" height="12" rx="1"/>
        </svg>
      ) : (
        // Speaker icon
        <svg width={iconSize} height={iconSize} viewBox="0 0 16 16" fill="currentColor">
          <path d="M9 2L5 6H2v4h3l4 4V2zm2.5 2.5a5 5 0 010 7 .5.5 0 01-.7-.7 4 4 0 000-5.6.5.5 0 01.7-.7z"/>
          <path d="M13.5 1.5a8 8 0 010 13 .5.5 0 01-.7-.7 7 7 0 000-11.6.5.5 0 01.7-.7z"/>
        </svg>
      )}
    </button>
  );
}