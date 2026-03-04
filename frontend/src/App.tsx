import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import DeckList from "./pages/DeckList";
import DeckDetail from "./pages/DeckDetail";
import ProgressPage from "./pages/ProgressPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import AuthPage from "./pages/AuthPage";
import MyDecksPage from "./pages/Mydeckspage";
import DeckManage from "./pages/DeckManage";

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
          <Route path="/decks/:id/manage" element={<DeckManage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}