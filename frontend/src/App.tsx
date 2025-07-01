import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreateRoomPage from './pages/CreateRoomPage';
import JoinRoomPage from './pages/JoinRoomPage';
import LobbyPage from './pages/LobbyPage';
import QuizPage from './pages/QuizPage';
import ResultsPage from './pages/ResultsPage';
import HealthMonitor from './components/HealthMonitor';

// Force new deployment to use updated workflow
function App() {
  return (
    <div className="min-h-screen bg-gray-100">
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
    </div>
  );
}

export default App;