import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import GlowButton from '../components/GlowButton.jsx';

export default function Dashboard() {
  const { username } = useAuth();
  return (
    <div className="page">
      <h1>Welcome, {username}</h1>
      <p className="muted">Choose what you'd like to do today.</p>
      <div className="card-grid">
        <div className="feature-card">
          <h2>Mock Interview Round</h2>
          <p>Upload your resume and get interviewed by AI for about 40-50 minutes, with a full mistakes-and-corrections report at the end.</p>
          <Link to="/interview"><GlowButton>Start Interview</GlowButton></Link>
        </div>
        <div className="feature-card">
          <h2>English Practice</h2>
          <p>Pick any topic and have a spoken-style conversation with AI to improve your communication skills.</p>
          <Link to="/practice"><GlowButton>Start Practice</GlowButton></Link>
        </div>
        <div className="feature-card">
          <h2>History & Progress</h2>
          <p>Review every past session's transcript and see the mistakes you've made before, so you can track improvement.</p>
          <Link to="/history"><GlowButton>View History</GlowButton></Link>
        </div>
      </div>
    </div>
  );
}
