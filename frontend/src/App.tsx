import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import OfflineIndicator from "./components/OfflineIndicator";

// ===== EAGER IMPORT — các trang cần hoạt động offline =====
// StudyPage và DeckDetail KHÔNG được lazy-load vì cần hoạt động khi offline
// (lazy() yêu cầu tải JS chunk qua mạng mỗi lần)
import StudyPage  from "./pages/Studypage";
import DeckDetail from "./pages/DeckDetail";

// ===== LAZY LOADING — các trang không cần offline =====
const HomePage      = lazy(() => import("./pages/HomePage"));
const AuthPage      = lazy(() => import("./pages/AuthPage"));
const DeckList      = lazy(() => import("./pages/DeckList"));
const MyDecksPage   = lazy(() => import("./pages/Mydeckspage"));
const SavedDecksPage = lazy(() => import("./pages/Saveddeckspage"));
const ProgressPage  = lazy(() => import("./pages/ProgressPage"));
const SchedulePage  = lazy(() => import("./pages/SchedulePage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const ProfilePage   = lazy(() => import("./pages/Profilepage"));
const SettingsPage  = lazy(() => import("./pages/Settingspage"));
const QuizSetupPage = lazy(() => import("./pages/QuizSetupPage"));
const QuizPlayPage  = lazy(() => import("./pages/QuizPlayPage"));
const QuizResultPage = lazy(() => import("./pages/QuizResultPage"));
const QuizHistoryPage = lazy(() => import("./pages/QuizHistoryPage"));

// ===== Loading Fallback =====
function PageLoader() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 40, height: 40, border: "3px solid #f3f3f3", borderTopColor: "#0D1B2A", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <OfflineIndicator /> {/* NEW: Offline banner */}

        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<AuthPage type="login" />} />
            <Route path="/register" element={<AuthPage type="register" />} />

            {/* Decks */}
            <Route path="/decks" element={<DeckList />} />
            <Route path="/decks/:id" element={<DeckDetail />} />
            <Route path="/my-decks" element={<MyDecksPage />} />
            <Route path="/saved-decks" element={<SavedDecksPage />} />

            {/* Study */}
            <Route path="/study/:deckId" element={<StudyPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/study/due" element={<SchedulePage />} />

            {/* Quiz */}
            <Route path="/quiz" element={<QuizSetupPage />} />
            <Route path="/quiz/play/:deckId" element={<QuizPlayPage />} />
            <Route path="/quiz/result/:resultId" element={<QuizResultPage />} />
            <Route path="/quiz/history" element={<QuizHistoryPage />} />

            {/* User */}
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}