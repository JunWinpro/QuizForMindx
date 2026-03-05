import React, { useRef, useState, useCallback } from "react";
import api from "../api/axios";

interface CardRow {
  front: string;
  back: string;
  example?: string;
  phonetic?: string;
  audioUrl?: string;
  imageUrl?: string;
}

interface Props {
  deckId: string;
  deckLanguage?: string;
  onClose: () => void;
  onImported: (newCards: any[]) => void;
}

function parseRows(raw: string): CardRow[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() !== "")
    .map((line) => {
      const sep = line.includes("\t") ? "\t" : ",";
      const cols = line.split(sep).map((c) => c.trim());
      const [front = "", back = "", example = "", phonetic = "", audioUrl = "", imageUrl = ""] = cols;
      return { front, back, example, phonetic, audioUrl, imageUrl };
    })
    .filter((r) => r.front && r.back);
}

async function extractTextFromXlsx(file: File): Promise<string> {
  // @ts-ignore
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  return aoa
    .filter((row) => row.some((c: any) => String(c).trim() !== ""))
    .map((row) => row.map((c: any) => String(c ?? "").trim()).join("\t"))
    .join("\n");
}

function Badge({ count }: { count: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 22, height: 22, padding: "0 7px", borderRadius: 99, background: "var(--navy)", color: "white", fontWeight: 700, fontSize: 12 }}>
      {count}
    </span>
  );
}

function PreviewTable({ rows }: { rows: CardRow[] }) {
  if (!rows.length) return null;
  return (
    <div style={{ maxHeight: 240, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 10, marginTop: 12 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "var(--cream-2)", position: "sticky", top: 0 }}>
            {["#", "Mặt trước", "Mặt sau", "Ví dụ", "Phiên âm"].map((h) => (
              <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, color: "var(--muted)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "white" : "var(--cream)" }}>
              <td style={{ padding: "6px 10px", color: "var(--muted)", width: 32 }}>{i + 1}</td>
              <td style={{ padding: "6px 10px", fontWeight: 600, color: "var(--navy)" }}>{r.front}</td>
              <td style={{ padding: "6px 10px" }}>{r.back}</td>
              <td style={{ padding: "6px 10px", color: "var(--muted)" }}>{r.example}</td>
              <td style={{ padding: "6px 10px", color: "var(--muted)", fontFamily: "monospace" }}>{r.phonetic}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ImportCards({ deckId, onClose, onImported }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rawText, setRawText] = useState("");
  const [preview, setPreview] = useState<CardRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const applyText = useCallback((text: string) => {
    setRawText(text);
    setPreview(parseRows(text));
    setErrors([]);
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setParsing(true);
    setErrors([]);
    setFileName(file.name);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      let text = "";
      if (ext === "xlsx" || ext === "xls") {
        text = await extractTextFromXlsx(file);
      } else if (ext === "docx") {
        setErrors(["File .docx chưa được hỗ trợ. Vui lòng mở Word → Lưu thành .txt, hoặc copy/paste nội dung vào ô bên dưới."]);
        setParsing(false);
        return;
      } else {
        text = await file.text();
      }
      applyText(text);
    } catch (e: any) {
      setErrors([`Không đọc được file: ${e?.message || e}`]);
    } finally {
      setParsing(false);
    }
  }, [applyText]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    if (!preview.length) return;
    setImporting(true);
    setProgress({ done: 0, total: preview.length });
    const succeeded: any[] = [];
    const errs: string[] = [];

    for (let i = 0; i < preview.length; i++) {
      const row = preview[i];
      try {
        const res = await api.post(`/decks/${deckId}/cards`, {
          front: row.front,
          back: row.back,
          example: row.example || undefined,
          phonetic: row.phonetic || undefined,
          audioUrl: row.audioUrl || undefined,
          imageUrl: row.imageUrl || undefined,
        });
        if (res.data?.success) succeeded.push(res.data.data);
        else errs.push(`Dòng ${i + 1} (${row.front}): ${res.data?.message || "Lỗi"}`);
      } catch (e: any) {
        errs.push(`Dòng ${i + 1} (${row.front}): ${e?.response?.data?.message || e?.message}`);
      }
      setProgress({ done: i + 1, total: preview.length });
    }

    setErrors(errs);
    setImporting(false);
    if (succeeded.length > 0) {
      onImported(succeeded);
      if (!errs.length) onClose();
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose}
    >
      <div
        style={{ width: "100%", maxWidth: 620, background: "white", borderRadius: 16, padding: 24, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: "'Fraunces', serif", color: "var(--navy)" }}>📥 Nhập hàng loạt thẻ</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>Hỗ trợ .txt · .tsv · .csv · .xlsx · paste trực tiếp</p>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "transparent", fontSize: 22, cursor: "pointer", color: "var(--muted)" }}>✕</button>
        </div>

        {/* Format hint */}
        <div style={{ background: "var(--cream-2)", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "var(--muted)", marginBottom: 16, fontFamily: "monospace", lineHeight: 1.7 }}>
          <strong style={{ color: "var(--navy)", fontFamily: "inherit" }}>Định dạng mỗi dòng (TAB):</strong><br />
          front &#9; back &#9; example &#9; phonetic<br />
          <em style={{ opacity: 0.7 }}>Chỉ cần 2 cột đầu. Cột trống thì bỏ qua.</em>
        </div>

        {/* Drop zone */}
        <div
          style={{ border: `2px dashed ${isDragging ? "var(--navy)" : "var(--border)"}`, borderRadius: 14, padding: "28px 20px", textAlign: "center", cursor: "pointer", background: isDragging ? "rgba(13,27,42,.04)" : "var(--cream)", transition: "all .15s", marginBottom: 16 }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".txt,.tsv,.csv,.xlsx,.xls" style={{ display: "none" }} onChange={onFileChange} />
          <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
          <div style={{ fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>
            {parsing ? "Đang đọc file…" : fileName ? `✅ ${fileName}` : "Kéo thả file vào đây"}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            hoặc <span style={{ color: "var(--navy)", fontWeight: 600 }}>click để chọn file</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: 12, color: "var(--muted)" }}>hoặc paste text</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        {/* Textarea */}
        <textarea
          placeholder={"abandon\ttừ bỏ\tHe abandoned the plan\t/əˈbændən/\nsevere\tnghiêm trọng\tThe storm was severe\t/sɪˈvɪə/"}
          value={rawText}
          onChange={(e) => applyText(e.target.value)}
          rows={4}
          style={{ width: "100%", borderRadius: 10, border: "1.5px solid var(--border)", padding: "10px 12px", fontFamily: "monospace", fontSize: 12, resize: "vertical", outline: "none", boxSizing: "border-box", color: "var(--navy)", background: "var(--cream)" }}
        />

        {/* Preview */}
        {preview.length > 0 && (
          <div style={{ marginTop: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: "var(--navy)" }}>Xem trước</span>
              <Badge count={preview.length} />
              <span style={{ fontSize: 12, color: "var(--muted)" }}>thẻ sẽ được nhập</span>
            </div>
            <PreviewTable rows={preview.slice(0, 50)} />
            {preview.length > 50 && <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>… và {preview.length - 50} thẻ nữa</p>}
          </div>
        )}

        {/* Progress */}
        {progress && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
              <span>Đang nhập…</span><span>{progress.done} / {progress.total}</span>
            </div>
            <div style={{ height: 6, background: "var(--cream-2)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(progress.done / progress.total) * 100}%`, background: "var(--navy)", borderRadius: 4, transition: "width .2s" }} />
            </div>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div style={{ marginTop: 12, background: "rgba(255,107,107,.08)", border: "1px solid rgba(255,107,107,.3)", borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontWeight: 700, color: "#c0392b", fontSize: 13, marginBottom: 4 }}>⚠️</div>
            {errors.slice(0, 5).map((e, i) => <div key={i} style={{ fontSize: 12, color: "#c0392b" }}>{e}</div>)}
            {errors.length > 5 && <div style={{ fontSize: 12, color: "var(--muted)" }}>… và {errors.length - 5} lỗi khác</div>}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: "10px 18px", borderRadius: 10, border: "1.5px solid var(--border)", background: "white", cursor: "pointer", fontWeight: 600, color: "var(--muted)" }}>
            Huỷ
          </button>
          <button
            onClick={handleImport}
            disabled={preview.length === 0 || importing}
            style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: preview.length === 0 || importing ? "var(--cream-2)" : "var(--navy)", color: preview.length === 0 || importing ? "var(--muted)" : "white", cursor: preview.length === 0 || importing ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 14 }}
          >
            {importing ? `Đang nhập (${progress?.done}/${progress?.total})…` : `📥 Nhập ${preview.length} thẻ`}
          </button>
        </div>
      </div>
    </div>
  );
}