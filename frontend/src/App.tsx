import { Routes, Route, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CreateRoomPage from "./pages/CreateRoomPage";
import JoinRoomPage from "./pages/JoinRoomPage";
import LobbyPage from "./pages/LobbyPage";
import QuizPage from "./pages/QuizPage";
import ResultsPage from "./pages/ResultsPage";
import HealthMonitor from "./components/HealthMonitor";
import LanguageSwitcher from "./components/LanguageSwitcher";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import { useEffect } from "react";
import { trackPageView } from "./utils/analytics";

// Force new deployment to use updated workflow
function App() {
  const location = useLocation();

  // Track page views when location changes
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Floating language switcher in the top-right corner */}
      <div className="fixed top-2 right-2 z-50 opacity-70 hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
        <LanguageSwitcher />
      </div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create-room" element={<CreateRoomPage />} />
        <Route path="/join-room" element={<JoinRoomPage />} />
        <Route path="/lobby/:id" element={<LobbyPage />} />
        <Route path="/quiz/:id" element={<QuizPage />} />
        <Route path="/results/:roomId" element={<ResultsPage />} />
      </Routes>
      
      {/* Health Monitor - only shows in development mode */}
      {import.meta.env.MODE === 'development' && <HealthMonitor />}
      
      {/* Analytics Dashboard - only shows in development mode */}
      {import.meta.env.MODE === 'development' && <AnalyticsDashboard />}
    </div>
  );
}

export default App;