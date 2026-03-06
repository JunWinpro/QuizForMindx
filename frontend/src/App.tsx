import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import DeckList from "./pages/DeckList";
import DeckDetail from "./pages/DeckDetail";
import ProgressPage from "./pages/ProgressPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import AuthPage from "./pages/AuthPage";
import MyDecksPage from "./pages/Mydeckspage";
import StudyPage from "./pages/Studypage";
import SchedulePage from "./pages/SchedulePage";
import QuizSetupPage from "./pages/QuizSetupPage";
import QuizPlayPage from "./pages/QuizPlayPage";
import QuizResultPage from "./pages/QuizResultPage";
import QuizHistoryPage from "./pages/QuizHistoryPage";
import SettingsPage from "./pages/Settingspage";
import SavedDecksPage from "./pages/Saveddeckspage";


export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div>
        <Routes>

          <Route path="/"            element={<HomePage />} />
          <Route path="/decks"       element={<DeckList />} />
          <Route path="/decks/:id"   element={<DeckDetail />} />
          <Route path="/progress"    element={<ProgressPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/login"       element={<AuthPage type="login" />} />
          <Route path="/register"    element={<AuthPage type="register" />} />
          <Route path="/my-decks"    element={<MyDecksPage />} />
          <Route path="/study/:deckId" element={<StudyPage />} />
          <Route path="/schedule"    element={<SchedulePage />} />
          <Route path="/study/due"   element={<SchedulePage />} />
<Route path="/saved-decks" element={<SavedDecksPage />} />
          <Route path="/quiz"                   element={<QuizSetupPage />} />
          <Route path="/quiz/history"           element={<QuizHistoryPage />} />
          <Route path="/quiz/result/:resultId"  element={<QuizResultPage />} />
          <Route path="/quiz/play/:deckId"      element={<QuizPlayPage />} />
          <Route path="/settings"              element={<SettingsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}