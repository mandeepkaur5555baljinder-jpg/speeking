import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import SpeedReading from './pages/SpeedReading';
import LiveConversation from './pages/LiveConversation';
import TutorChat from './pages/TutorChat';
import SpeakingDrills from './pages/SpeakingDrills';
import RoleplayDojo from './pages/RoleplayDojo';
import AccentCoach from './pages/AccentCoach';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-slate-200 flex flex-col">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/speed-read" element={<SpeedReading />} />
            <Route path="/live-speak" element={<LiveConversation />} />
            <Route path="/tutor" element={<TutorChat />} />
            <Route path="/drills" element={<SpeakingDrills />} />
            <Route path="/roleplay" element={<RoleplayDojo />} />
            <Route path="/accent" element={<AccentCoach />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
