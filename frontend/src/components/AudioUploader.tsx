/**
 * src/components/AudioUploader.tsx
 * 
 * Component upload/ghi âm cho card - Sử dụng backend API thay vì Firebase
 */

import { useState, useRef, useCallback, useEffect } from "react";
import {
  uploadAudioFile,
  validateAudioFile,
  formatFileSize,
  type UploadProgress,
} from "../utils/audioUpload";

// ─── Props ────────────────────────────────────────────────────────────────────
interface AudioUploaderProps {
  deckId: string;
  /** URL audio hiện tại (nếu đang edit card) */
  currentAudioUrl?: string;
  /** Callback khi upload xong hoặc xoá → trả về URL mới (hoặc "" nếu xoá) */
  onChange: (audioUrl: string, storagePath: string) => void;
  disabled?: boolean;
}

// ─── Styles helpers ───────────────────────────────────────────────────────────
const btnBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  fontFamily: "'Outfit', sans-serif",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  transition: "opacity .15s",
};

// ─────────────────────────────────────────────────────────────────────────────
export default function AudioUploader({
  
  currentAudioUrl,
  onChange,
  disabled = false,
}: AudioUploaderProps) {
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState(currentAudioUrl ?? "");

  // Recording state
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Drag & drop
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync nếu prop thay đổi từ bên ngoài
  useEffect(() => {
    setAudioUrl(currentAudioUrl ?? "");
    setError(null);
  }, [currentAudioUrl]);

  // ── Upload logic ───────────────────────────────────────────────────────────
  const handleUpload = useCallback(
    async (file: File) => {
      const err = validateAudioFile(file);
      if (err) { setError(err); return; }

      setError(null);
      setUploading(true);
      setProgress({ percent: 0, bytesTransferred: 0, totalBytes: file.size });

      try {
        const result = await uploadAudioFile(file, (p) => setProgress(p));
        // Construct full URL for audio playback
        const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
        const fullAudioUrl = result.downloadUrl.startsWith('http') 
          ? result.downloadUrl 
          : `${baseUrl}${result.downloadUrl}`;
        
        setAudioUrl(fullAudioUrl);
        onChange(fullAudioUrl, result.storagePath);
        setProgress(null);
      } catch (e: any) {
        setError(e?.message ?? "Upload thất bại");
        setProgress(null);
      } finally {
        setUploading(false);
      }
    },
    [onChange]
  );

  // ── File input ─────────────────────────────────────────────────────────────
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = "";
  };

  // ── Drag & drop ────────────────────────────────────────────────────────────
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploading) setDragging(true);
  };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  // ── Ghi âm ────────────────────────────────────────────────────────────────
  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const file = new File([blob], `recording_${Date.now()}.webm`, {
          type: mimeType,
        });
        await handleUpload(file);
      };

      mr.start(250);
      setRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch {
      setError("Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    setRecording(false);
    setRecordingSeconds(0);
  };

  // ── Xoá audio ─────────────────────────────────────────────────────────────
  const handleRemove = async () => {
    try {
      // Extract filename from URL
      const fileName = audioUrl.split('/').pop();
      if (fileName) {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/audio/${fileName}`, {
          method: 'DELETE',
        });
      }
    } catch (error) {
      console.error('Error deleting audio:', error);
    }
    
    setAudioUrl("");
    setError(null);
    onChange("", "");
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text)",
          display: "block",
        }}
      >
        🎵 Audio (tuỳ chọn)
      </label>

      {/* Hiển thị audio hiện tại */}
      {audioUrl && !uploading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            background: "var(--cream-2, #f5f3ee)",
            borderRadius: 10,
            border: "1px solid var(--border, #e0ddd5)",
          }}
        >
          <span style={{ fontSize: 20 }}>🎧</span>
          <audio
            src={audioUrl}
            controls
            style={{ flex: 1, height: 32, minWidth: 0 }}
          />
          {!disabled && (
            <button
              onClick={handleRemove}
              title="Xoá audio"
              style={{
                ...btnBase,
                padding: "6px 10px",
                background: "rgba(255,107,107,0.12)",
                color: "#e05252",
                flexShrink: 0,
              }}
            >
              🗑
            </button>
          )}
        </div>
      )}

      {/* Upload + Ghi âm */}
      {!audioUrl && !uploading && !recording && (
        <>
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => !disabled && fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? "var(--navy, #1a2340)" : "var(--border, #e0ddd5)"}`,
              borderRadius: 10,
              padding: "18px 14px",
              textAlign: "center",
              cursor: disabled ? "default" : "pointer",
              background: dragging ? "rgba(26,35,64,0.04)" : "transparent",
              transition: "all .15s",
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 6 }}>📁</div>
            <div style={{ fontSize: 13, color: "var(--muted, #888)", lineHeight: 1.5 }}>
              Kéo thả file âm thanh vào đây<br />
              hoặc <span style={{ color: "var(--navy, #1a2340)", fontWeight: 700 }}>click để chọn file</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--muted, #aaa)", marginTop: 4 }}>
              MP3, WAV, OGG, WebM, AAC, M4A — tối đa 10 MB
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm,audio/aac,audio/m4a,audio/x-m4a"
            onChange={onFileChange}
            style={{ display: "none" }}
            disabled={disabled}
          />

          {"mediaDevices" in navigator && (
            <button
              onClick={startRecording}
              disabled={disabled}
              style={{
                ...btnBase,
                background: "var(--navy, #1a2340)",
                color: "white",
                justifyContent: "center",
                opacity: disabled ? 0.5 : 1,
              }}
            >
              🎙️ Ghi âm trực tiếp
            </button>
          )}
        </>
      )}

      {/* Đang ghi âm */}
      {recording && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            background: "rgba(255, 80, 80, 0.08)",
            borderRadius: 10,
            border: "1px solid rgba(255,80,80,0.2)",
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#ff5050",
              animation: "pulse 1s infinite",
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#c0392b", flex: 1 }}>
            Đang ghi âm... {formatTime(recordingSeconds)}
          </span>
          <button
            onClick={stopRecording}
            style={{
              ...btnBase,
              background: "#ff5050",
              color: "white",
            }}
          >
            ⏹ Dừng & Upload
          </button>
        </div>
      )}

      {/* Tiến trình upload */}
      {uploading && progress && (
        <div
          style={{
            padding: "12px 16px",
            background: "var(--cream-2, #f5f3ee)",
            borderRadius: 10,
            border: "1px solid var(--border, #e0ddd5)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
              fontSize: 13,
            }}
          >
            <span style={{ fontWeight: 600, color: "var(--navy, #1a2340)" }}>
              ⬆️ Đang tải lên...
            </span>
            <span style={{ color: "var(--muted, #888)" }}>
              {formatFileSize(progress.bytesTransferred)} / {formatFileSize(progress.totalBytes)}
            </span>
          </div>
          <div
            style={{
              height: 6,
              background: "var(--border, #e0ddd5)",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress.percent}%`,
                background: "var(--navy, #1a2340)",
                borderRadius: 3,
                transition: "width .2s",
              }}
            />
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: "var(--muted, #aaa)", textAlign: "right" }}>
            {progress.percent}%
          </div>
        </div>
      )}

      {/* Lỗi */}
      {error && (
        <div
          style={{
            padding: "10px 14px",
            background: "rgba(255,107,107,0.1)",
            borderRadius: 8,
            fontSize: 13,
            color: "#c0392b",
            border: "1px solid rgba(255,107,107,0.25)",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}