import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/history')
      .then(({ data }) => setSessions(data.sessions))
      .catch(err => setError(err.response?.data?.message || 'Failed to load history.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <h1>Your History</h1>
      <p className="muted">Every past interview and practice session, so you can see the mistakes you've made before.</p>
      {error && <p className="error">{error}</p>}
      {loading && <p className="muted small">Loading...</p>}
      <div className="history-list">
        {sessions.map(s => (
          <Link to={`/history/${s.id}`} key={s.id} className="history-item">
            <div>
              <span className={`badge badge--${s.type}`}>{s.type === 'interview' ? 'Interview' : 'Practice'}</span>
              <p>{s.topic || 'Resume-based interview'}</p>
              <p className="muted small">{new Date(s.startedAt).toLocaleString()}</p>
            </div>
            <div className="score-pill">{s.score != null ? `${s.score}/10` : 'In progress'}</div>
          </Link>
        ))}
        {!loading && sessions.length === 0 && (
          <p className="muted">No sessions yet. Start an interview or a practice session from the dashboard!</p>
        )}
      </div>
    </div>
  );
}
