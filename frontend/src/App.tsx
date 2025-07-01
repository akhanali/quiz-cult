import './App.css'
import { Route } from 'react-router-dom'
import { Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CreateRoomPage from './pages/CreateRoomPage'
import LobbyPage from './pages/LobbyPage'
import JoinRoomPage from './pages/JoinRoomPage'
import QuizPage from './pages/QuizPage'
import ResultsPage from './pages/ResultsPage'
import HealthMonitor from './components/HealthMonitor'

function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create-room" element={<CreateRoomPage />} />
        <Route path="/room/:id" element={<LobbyPage />} />
        <Route path="/join-room" element={<JoinRoomPage />} />
        <Route path="/quiz/:id" element={<QuizPage />} />
        <Route path="/results/:id" element={<ResultsPage />} />
      </Routes>
      
      {/* Health Monitor - only shows in development mode */}
      <HealthMonitor />
    </>
  )
}

export default App
