import { useEffect } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { useQuizSession } from "../hooks/useQuizSession";
import QuizQuestion from "../components/QuizQuestion";
import QuizTimer from "../components/QuizTimer";

export default function QuizPlayPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const count         = Math.max(1, parseInt(searchParams.get("count") ?? "20"));
  const timerSeconds  = parseInt(searchParams.get("timer") ?? "0");
  const timerEnabled  = timerSeconds > 0;

  const quiz = useQuizSession({
    deckId: deckId ?? "",
    count,
    timerEnabled,
    timerSeconds: timerSeconds || 30,
  });

  // Redirect sang result page khi có resultId
  useEffect(() => {
    if (quiz.resultId) {
      navigate(`/quiz/result/${quiz.resultId}`, { replace: true });
    }
  }, [quiz.resultId, navigate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!quiz.isAnswered) {
        if (e.key === "1") quiz.handleSelectAnswer(0);
        if (e.key === "2") quiz.handleSelectAnswer(1);
        if (e.key === "3") quiz.handleSelectAnswer(2);
        if (e.key === "4") quiz.handleSelectAnswer(3);
      } else {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") {
          e.preventDefault();
          quiz.nextQuestion();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [quiz.isAnswered, quiz.handleSelectAnswer, quiz.nextQuestion]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (quiz.loading) {
    return (
      <div style={{
        minHeight: "calc(100vh - 64px)",
        background: "var(--navy)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
      }}>
        <div style={{
          width: 48,
          height: 48,
          border: "4px solid rgba(255,255,255,.1)",
          borderTopColor: "var(--emerald)",
          borderRadius: "50%",
          animation: "spin .8s linear infinite",
        }} />
        <p style={{ color: "rgba(255,255,255,.5)", fontSize: 15 }}>Đang tạo câu hỏi...</p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (quiz.error) {
    return (
      <div style={{
        minHeight: "calc(100vh - 64px)",
        background: "var(--navy)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 24,
        textAlign: "center",
      }}>
        <div style={{ fontSize: 48 }}>😕</div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, color: "white" }}>
          Không thể tạo quiz
        </div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,.5)", maxWidth: 360 }}>
          {quiz.error}
        </div>
        <Link
          to="/quiz"
          style={{
            marginTop: 8,
            background: "var(--emerald)",
            color: "var(--navy)",
            padding: "12px 28px",
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          ← Quay lại
        </Link>
      </div>
    );
  }

  // ── Saving overlay ───────────────────────────────────────────────────────
  if (quiz.isFinished && quiz.isSaving) {
    return (
      <div style={{
        minHeight: "calc(100vh - 64px)",
        background: "var(--navy)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
      }}>
        <div style={{
          width: 48,
          height: 48,
          border: "4px solid rgba(255,255,255,.1)",
          borderTopColor: "var(--emerald)",
          borderRadius: "50%",
          animation: "spin .8s linear infinite",
        }} />
        <p style={{ color: "rgba(255,255,255,.5)", fontSize: 15 }}>Đang lưu kết quả...</p>
      </div>
    );
  }

  const { currentQuestion, currentIndex, totalCount } = quiz;
  if (!currentQuestion) return null;

  // Progress %



  const answeredCount = currentIndex + (quiz.isAnswered ? 1 : 0);

  return (
    <div style={{
      minHeight: "calc(100vh - 64px)",
      background: "linear-gradient(160deg, #0D1B2A 0%, #0e2035 60%, #0a1925 100%)",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background decorative blobs */}
      <div style={{
        position: "absolute",
        width: 400,
        height: 400,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,200,150,.04), transparent)",
        top: "-10%",
        right: "-5%",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        width: 300,
        height: 300,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(245,166,35,.03), transparent)",
        bottom: "10%",
        left: "-5%",
        pointerEvents: "none",
      }} />

      {/* ── Top bar ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 28px 0",
        maxWidth: 760,
        width: "100%",
        margin: "0 auto",
        boxSizing: "border-box",
      }}>
        {/* Back button */}
        <Link
          to="/quiz"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "rgba(255,255,255,.45)",
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 500,
            transition: "color .2s",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,.8)"}
          onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,.45)"}
        >
          ← Thoát
        </Link>

        {/* Center: question count + correct count */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            background: "rgba(255,255,255,.06)",
            border: "1px solid rgba(255,255,255,.1)",
            borderRadius: 20,
            padding: "4px 14px",
            fontSize: 13,
            fontWeight: 600,
            color: "rgba(255,255,255,.7)",
          }}>
            {currentIndex + 1} / {totalCount}
          </div>
          <div style={{
            background: "rgba(0,200,150,.12)",
            border: "1px solid rgba(0,200,150,.2)",
            borderRadius: 20,
            padding: "4px 14px",
            fontSize: 13,
            fontWeight: 700,
            color: "#00C896",
          }}>
            ✅ {quiz.correctCount}
          </div>
        </div>

        {/* Timer or spacer */}
        {timerEnabled ? (
          <QuizTimer
            timeLeft={quiz.timeLeft}
            total={timerSeconds}
            size={52}
          />
        ) : (
          <div style={{ width: 52 }} />
        )}
      </div>

      {/* ── Progress bar ── */}
      <div style={{
        maxWidth: 760,
        width: "100%",
        margin: "16px auto 0",
        padding: "0 28px",
        boxSizing: "border-box",
      }}>
        <div style={{
          height: 3,
          background: "rgba(255,255,255,.08)",
          borderRadius: 2,
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            width: `${Math.round((answeredCount / totalCount) * 100)}%`,
            background: "linear-gradient(90deg, var(--emerald), #00e6ab)",
            borderRadius: 2,
            transition: "width .4s ease",
          }} />
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px 40px",
        maxWidth: 760,
        width: "100%",
        margin: "0 auto",
        boxSizing: "border-box",
      }}>
        <div style={{ width: "100%", animation: "fadeIn .25s ease" }} key={currentIndex}>
          <QuizQuestion
            question={currentQuestion}
            selectedIndex={quiz.selectedIndex}
            onSelect={quiz.handleSelectAnswer}
            questionNumber={currentIndex + 1}
            totalQuestions={totalCount}
          />
        </div>

        {/* ── Action area ── */}
        <div style={{
          marginTop: 32,
          width: "100%",
          maxWidth: 640,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          minHeight: 80,
        }}>
          {quiz.isAnswered ? (
            <>
              {/* Result message */}
              {quiz.selectedIndex !== null && (
                <div style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: quiz.selectedIndex !== -1 && quiz.selectedIndex === currentQuestion.correctIndex
                    ? "#00C896"
                    : "#FF6B6B",
                  animation: "fadeIn .2s ease",
                  marginBottom: 4,
                }}>
                  {quiz.selectedIndex === -1
                    ? "⏰ Hết giờ! Đáp án đúng là: " + currentQuestion.options[currentQuestion.correctIndex]
                    : quiz.selectedIndex === currentQuestion.correctIndex
                    ? "🎉 Chính xác!"
                    : `❌ Sai! Đáp án đúng: ${currentQuestion.options[currentQuestion.correctIndex]}`}
                </div>
              )}

              {/* Next button */}
              <button
                onClick={quiz.nextQuestion}
                style={{
                  background: "white",
                  color: "var(--navy)",
                  border: "none",
                  borderRadius: 14,
                  padding: "14px 48px",
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: "pointer",
                  fontFamily: "'Outfit', sans-serif",
                  boxShadow: "0 8px 32px rgba(255,255,255,.12)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all .15s",
                  letterSpacing: "-0.2px",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 40px rgba(255,255,255,.18)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px rgba(255,255,255,.12)";
                }}
              >
                {currentIndex + 1 >= totalCount ? "📊 Xem kết quả" : "Tiếp theo →"}
              </button>

              {/* Keyboard hint */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                color: "rgba(255,255,255,.25)",
              }}>
                <kbd style={{
                  background: "rgba(255,255,255,.06)",
                  border: "1px solid rgba(255,255,255,.12)",
                  borderRadius: 4,
                  padding: "1px 6px",
                  fontFamily: "monospace",
                  fontSize: 10,
                }}>Enter</kbd>
                <span>để tiếp tục</span>
              </div>
            </>
          ) : (
            /* Keyboard hint before answering */
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 11,
              color: "rgba(255,255,255,.2)",
              flexWrap: "wrap",
              justifyContent: "center",
            }}>
              {currentQuestion.options.map((_, i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <kbd style={{
                    background: "rgba(255,255,255,.04)",
                    border: "1px solid rgba(255,255,255,.1)",
                    borderRadius: 4,
                    padding: "1px 6px",
                    fontFamily: "monospace",
                    fontSize: 10,
                    color: "rgba(255,255,255,.3)",
                  }}>{i + 1}</kbd>
                  <span style={{ color: "rgba(255,255,255,.15)" }}>{"ABCD"[i]}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}