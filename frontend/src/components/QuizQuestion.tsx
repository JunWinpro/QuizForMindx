import React from "react";
import type { QuizQuestion as QuizQuestionType } from "../hooks/useQuizSession";

interface QuizQuestionProps {
  question: QuizQuestionType;
  selectedIndex: number | null; // null = unanswered; -1 = timeout
  onSelect: (index: number) => void;
  questionNumber: number;
  totalQuestions: number;
}

/**
 * Trạng thái từng option:
 * - default:  white/translucent → hover sáng lên
 * - correct:  emerald nền, white text (luôn show sau khi answered)
 * - wrong:    đỏ nền, white text (chỉ show option user chọn sai)
 * - disabled: mờ (các option còn lại sau khi đã chọn)
 */
export default function QuizQuestion({
  question,
  selectedIndex,
  onSelect,
  questionNumber,
  totalQuestions,
}: QuizQuestionProps) {
  const isAnswered = selectedIndex !== null;
  const isTimeout  = selectedIndex === -1;

  const getOptionState = (idx: number) => {
    if (!isAnswered) return "default";
    if (idx === question.correctIndex) return "correct";
    if (!isTimeout && idx === selectedIndex) return "wrong";
    return "disabled";
  };

  const optionStyles = {
    default: {
      background: "rgba(255,255,255,0.06)",
      border: "1.5px solid rgba(255,255,255,0.15)",
      color: "rgba(255,255,255,0.92)",
      cursor: "pointer",
    },
    correct: {
      background: "rgba(0,200,150,0.18)",
      border: "2px solid #00C896",
      color: "#00C896",
      cursor: "default",
    },
    wrong: {
      background: "rgba(255,107,107,0.18)",
      border: "2px solid #FF6B6B",
      color: "#FF6B6B",
      cursor: "default",
    },
    disabled: {
      background: "rgba(255,255,255,0.02)",
      border: "1.5px solid rgba(255,255,255,0.06)",
      color: "rgba(255,255,255,0.28)",
      cursor: "default",
    },
  };

  const letters = ["A", "B", "C", "D", "E", "F"];

  return (
    <div style={{ width: "100%", maxWidth: 640, margin: "0 auto" }}>
      {/* Question label */}
      <div style={{
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.4)",
        marginBottom: 16,
        textAlign: "center",
      }}>
        Câu {questionNumber} / {totalQuestions} — Chọn đáp án đúng
      </div>

      {/* Question text */}
      <div style={{
        textAlign: "center",
        marginBottom: 40,
        padding: "0 8px",
      }}>
        <div style={{
          fontFamily: "'Fraunces', serif",
          fontSize: "clamp(32px, 6vw, 52px)",
          fontWeight: 700,
          color: "white",
          lineHeight: 1.15,
          letterSpacing: "-1px",
          textShadow: "0 4px 24px rgba(0,0,0,0.3)",
          marginBottom: 8,
        }}>
          {question.question}
        </div>
        {/* Timeout notice */}
        {isTimeout && (
          <div style={{
            fontSize: 13,
            color: "#FF6B6B",
            fontStyle: "italic",
            marginTop: 8,
            animation: "fadeIn .3s ease",
          }}>
            ⏰ Hết giờ!
          </div>
        )}
      </div>

      {/* Options grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: question.options.length <= 2
          ? "1fr"
          : "repeat(2, 1fr)",
        gap: 12,
      }}>
        {question.options.map((option, idx) => {
          const state = getOptionState(idx);
          const styles = optionStyles[state];
          const isCorrectOption = idx === question.correctIndex;
          const isSelectedWrong = !isTimeout && idx === selectedIndex && idx !== question.correctIndex;

          return (
            <button
              key={idx}
              onClick={() => !isAnswered && onSelect(idx)}
              disabled={isAnswered}
              style={{
                ...styles,
                borderRadius: 16,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                width: "100%",
                textAlign: "left",
                fontFamily: "'Outfit', sans-serif",
                fontSize: 15,
                fontWeight: 600,
                transition: "all 0.2s ease",
                transform: "translateY(0)",
                outline: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
              onMouseEnter={e => {
                if (!isAnswered) {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)";
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.3)";
                }
              }}
              onMouseLeave={e => {
                if (!isAnswered) {
                  (e.currentTarget as HTMLButtonElement).style.background = optionStyles.default.background;
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = optionStyles.default.border.replace("1.5px solid ", "");
                }
              }}
            >
              {/* Letter badge */}
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 30,
                height: 30,
                borderRadius: "50%",
                fontSize: 12,
                fontWeight: 800,
                flexShrink: 0,
                background: state === "correct"
                  ? "rgba(0,200,150,0.25)"
                  : state === "wrong"
                  ? "rgba(255,107,107,0.25)"
                  : "rgba(255,255,255,0.08)",
                color: state === "correct"
                  ? "#00C896"
                  : state === "wrong"
                  ? "#FF6B6B"
                  : "rgba(255,255,255,0.5)",
                letterSpacing: 0,
                transition: "all .2s",
              }}>
                {letters[idx]}
              </span>

              {/* Option text */}
              <span style={{ flex: 1, lineHeight: 1.4 }}>{option}</span>

              {/* Result icon */}
              {isAnswered && (
                <span style={{
                  fontSize: 18,
                  flexShrink: 0,
                  opacity: state === "disabled" ? 0 : 1,
                  transition: "opacity .2s",
                }}>
                  {state === "correct" ? "✅" : state === "wrong" ? "❌" : ""}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}