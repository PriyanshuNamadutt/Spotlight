import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import InterviewRound from './pages/InterviewRound.jsx';
import PracticeEnglish from './pages/PracticeEnglish.jsx';
import History from './pages/History.jsx';
import SessionDetail from './pages/SessionDetail.jsx';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/interview" element={<ProtectedRoute><InterviewRound /></ProtectedRoute>} />
        <Route path="/practice" element={<ProtectedRoute><PracticeEnglish /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/history/:id" element={<ProtectedRoute><SessionDetail /></ProtectedRoute>} />
      </Routes>
    </>
  );
}
