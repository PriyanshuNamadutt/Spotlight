import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios.js';
import ChatBubble from '../components/ChatBubble.jsx';
import { ReportView } from './InterviewRound.jsx';

export default function SessionDetail() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/history/${id}`)
      .then(({ data }) => setSession(data.session))
      .catch(err => setError(err.response?.data?.message || 'Failed to load session.'));
  }, [id]);

  if (error) return <div className="page"><p className="error">{error}</p></div>;
  if (!session) return <div className="page"><p className="muted">Loading...</p></div>;

  return (
    <div className="page">
      <h1>{session.type === 'interview' ? 'Interview Session' : `Practice: ${session.topic}`}</h1>
      <p className="muted small">{new Date(session.startedAt).toLocaleString()}</p>

      <h2>Transcript</h2>
      <div className="chat-window chat-window--static">
        {session.transcript.map((m, i) => <ChatBubble key={i} role={m.role} text={m.text} />)}
      </div>

      {session.report && (
        <>
          <h2>Report</h2>
          <ReportView report={session.report} />
        </>
      )}
    </div>
  );
}
