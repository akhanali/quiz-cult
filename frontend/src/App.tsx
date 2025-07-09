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
import FeedbackModal from "./components/FeedbackModal";
import { useEffect, useState } from "react";
import { trackPageView, trackEvent } from "./utils/analytics";
import { FaComments } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

// Force new deployment to use updated workflow
function App() {
  const location = useLocation();
  const { t } = useTranslation();
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Track page views when location changes
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  // Handle feedback button click
  const handleFeedbackClick = () => {
    trackEvent('button_click', 'engagement', 'feedback');
    setIsFeedbackModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Floating language switcher in the top-right corner */}
      <div className="fixed top-2 right-2 z-50 opacity-70 hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
        <LanguageSwitcher />
      </div>

      {/* Floating feedback button in the bottom-right corner */}
      <div className={`fixed bottom-4 z-40 ${import.meta.env.MODE === 'development' ? 'right-20' : 'right-4'}`}>
        <button
          onClick={handleFeedbackClick}
          className="bg-gradient-to-r from-[#10A3A2] to-[#05717B] text-white p-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 group"
          aria-label={t('Give feedback')}
          title={t('Give feedback')}
        >
          <FaComments className="text-xl" />
        </button>
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

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={isFeedbackModalOpen} 
        onClose={() => setIsFeedbackModalOpen(false)} 
      />
    </div>
  );
}

export default App;