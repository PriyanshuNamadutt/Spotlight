import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Volume2, VolumeX } from 'lucide-react';
import api from '../api/axios.js';
import GlowButton from '../components/GlowButton.jsx';
import useSpeechRecognition from '../hooks/useSpeechRecognition.js';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis.js';

export default function InterviewRound() {
  const [resumeFile, setResumeFile] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]); // stored/sent, never rendered during the live round
  const [typedAnswer, setTypedAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const [aiVoiceOn, setAiVoiceOn] = useState(true);

  const wasListeningRef = useRef(false);

  const speech = useSpeechRecognition();
  const tts = useSpeechSynthesis();
  const voiceReady = speech.isSupported && tts.isSupported;

  // Speak every new AI message aloud (unless muted). Text is never shown on screen.
  useEffect(() => {
    if (!aiVoiceOn || !tts.isSupported) return;
    const last = messages[messages.length - 1];
    if (last && last.role === 'model') {
      if (speech.listening) speech.stop();
      tts.speak(last.text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, aiVoiceOn]);

  // When the user presses Stop, silently submit whatever was transcribed —
  // the AI then processes it and asks the next question. Nothing is shown on screen.
  useEffect(() => {
    if (wasListeningRef.current && !speech.listening) {
      const text = speech.finalText.trim();
      if (text) submitAnswer(text);
      speech.reset();
    }
    wasListeningRef.current = speech.listening;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.listening]);

  useEffect(() => {
    return () => { tts.cancel(); speech.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleRecordClick() {
    if (speech.listening) {
      speech.stop(); // Stop button: finish answering, AI will process it next
    } else {
      speech.reset();
      speech.start(); // Start button: begin recording the answer
    }
  }

  async function handleStart(e) {
    e.preventDefault();
    if (!resumeFile) { setError('Please upload your resume (PDF, DOCX, or TXT).'); return; }
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      const { data } = await api.post('/interview/start', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSessionId(data.sessionId);
      setMessages([{ role: 'model', text: data.message }]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start interview.');
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer(text) {
    if (!text || loading) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);
    try {
      const { data } = await api.post('/interview/answer', { sessionId, answer: text });
      setMessages(prev => [...prev, { role: 'model', text: data.message }]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get next question.');
    } finally {
      setLoading(false);
    }
  }

  function handleTypedSend(e) {
    e.preventDefault();
    const text = typedAnswer.trim();
    if (!text) return;
    setTypedAnswer('');
    submitAnswer(text);
  }

  async function handleEnd() {
    if (!window.confirm('End this interview round and generate your report now?')) return;
    tts.cancel();
    speech.stop();
    setLoading(true);
    try {
      const { data } = await api.post('/interview/end', { sessionId });
      setReport(data.report);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report.');
    } finally {
      setLoading(false);
    }
  }

  if (report) {
    return (
      <div className="page">
        <h1>Interview Report</h1>
        <ReportView report={report} />
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="page">
        <h1>Start a Mock Interview Round</h1>
        <form className="upload-card" onSubmit={handleStart}>
          <p className="muted">
            Upload your resume (PDF, DOCX, or TXT). This is a spoken interview: the AI will greet you
            out loud, ask you to introduce yourself, then ask questions based on your resume for roughly
            40-50 minutes. Press <strong>Start</strong> to begin speaking your answer, and
            <strong> Stop</strong> when you're done — the AI will then process it and ask the next
            question. Nothing is shown on screen during the conversation; every exchange is transcribed
            to text and saved, so you can read the full transcript and report afterward in History.
          </p>
          {!voiceReady && (
            <p className="muted small">
              Voice conversation isn't supported in this browser — try Chrome or Edge on desktop.
              You'll be able to type your answers instead.
            </p>
          )}
          <input type="file" accept=".pdf,.docx,.txt" onChange={e => setResumeFile(e.target.files[0])} />
          {error && <p className="error">{error}</p>}
          <GlowButton type="submit" disabled={loading}>{loading ? 'Starting...' : 'Start Interview'}</GlowButton>
        </form>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="chat-header">
        <h1>Mock Interview</h1>
        <GlowButton variant="ghost" onClick={handleEnd} disabled={loading}>End Round & Get Report</GlowButton>
      </div>

      <div className="voice-stage">
        <div className={`voice-orb ${tts.speaking ? 'voice-orb--speaking' : ''} ${speech.listening ? 'voice-orb--listening' : ''}`} />
        <p className="voice-caption">
          {loading && 'Thinking...'}
          {!loading && tts.speaking && 'AI is speaking...'}
          {!loading && !tts.speaking && speech.listening && 'Recording — press Stop when you\u2019re done'}
          {!loading && !tts.speaking && !speech.listening && voiceReady && 'Press Start when you\u2019re ready to answer'}
        </p>

        {voiceReady && (
          <button
            type="button"
            className={`glow-btn record-btn ${speech.listening ? 'record-btn--active' : ''}`}
            onClick={handleRecordClick}
            disabled={loading || tts.speaking}
          >
            {speech.listening ? <Square size={16} /> : <Mic size={16} />}
            {speech.listening ? 'Stop' : 'Start'}
          </button>
        )}
      </div>

      {!voiceReady && (
        <form className="chat-input" onSubmit={handleTypedSend}>
          <textarea
            placeholder="Type your answer..."
            value={typedAnswer}
            onChange={e => setTypedAnswer(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTypedSend(e); } }}
          />
          <GlowButton type="submit" disabled={loading}>Send</GlowButton>
        </form>
      )}

      {voiceReady && (
        <div className="voice-toggles">
          <button type="button" className="toggle-chip" onClick={() => setAiVoiceOn(v => !v)}>
            {aiVoiceOn ? <Volume2 size={14} /> : <VolumeX size={14} />} AI Voice: {aiVoiceOn ? 'On' : 'Off'}
          </button>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  );
}

export function ReportView({ report }) {
  return (
    <div className="report-card">
      <h2 style={{ marginTop: 0 }}>Summary</h2>
      <p>{report.overallSummary}</p>
      {report.score != null && <p className="score">Score: {report.score}/10</p>}

      <h2>Strengths</h2>
      {(report.strengths || []).length === 0
        ? <p className="muted small">No strengths listed.</p>
        : <ul>{report.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>}

      <h2>Mistakes & Corrections</h2>
      {(report.mistakes || []).length === 0 && <p className="muted small">No major mistakes found. Great job!</p>}
      {(report.mistakes || []).map((m, i) => (
        <div key={i} className="mistake-item">
          <p><strong>You said:</strong> {m.original}</p>
          <p><strong>Issue:</strong> {m.issue}</p>
          <p><strong>Correction:</strong> {m.correction}</p>
        </div>
      ))}

      <h2>Improvements</h2>
      {(report.improvements || []).length === 0
        ? <p className="muted small">No specific tips.</p>
        : <ul>{report.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>}
    </div>
  );
}