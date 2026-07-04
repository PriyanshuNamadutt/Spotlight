import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Volume2, VolumeX } from 'lucide-react';
import api from '../api/axios.js';
import GlowButton from '../components/GlowButton.jsx';
import { ReportView } from './InterviewRound.jsx';
import useSpeechRecognition from '../hooks/useSpeechRecognition.js';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis.js';

export default function PracticeEnglish() {
  const [topic, setTopic] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]); // stored/sent, never rendered during the live session
  const [typedMessage, setTypedMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const [aiVoiceOn, setAiVoiceOn] = useState(true);

  const wasListeningRef = useRef(false);

  const speech = useSpeechRecognition();
  const tts = useSpeechSynthesis();
  const voiceReady = speech.isSupported && tts.isSupported;

  useEffect(() => {
    if (!aiVoiceOn || !tts.isSupported) return;
    const last = messages[messages.length - 1];
    if (last && last.role === 'model') {
      if (speech.listening) speech.stop();
      tts.speak(last.text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, aiVoiceOn]);

  useEffect(() => {
    if (wasListeningRef.current && !speech.listening) {
      const text = speech.finalText.trim();
      if (text) submitMessage(text);
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
      speech.start(); // Start button: begin recording the response
    }
  }

  async function handleStart(e) {
    e.preventDefault();
    if (!topic.trim()) { setError('Please enter a topic to talk about.'); return; }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/practice/start', { topic });
      setSessionId(data.sessionId);
      setMessages([{ role: 'model', text: data.message }]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start session.');
    } finally {
      setLoading(false);
    }
  }

  async function submitMessage(text) {
    if (!text || loading) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);
    try {
      const { data } = await api.post('/practice/message', { sessionId, message: text });
      setMessages(prev => [...prev, { role: 'model', text: data.message }]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get response.');
    } finally {
      setLoading(false);
    }
  }

  function handleTypedSend(e) {
    e.preventDefault();
    const text = typedMessage.trim();
    if (!text) return;
    setTypedMessage('');
    submitMessage(text);
  }

  async function handleEnd() {
    if (!window.confirm('End this practice session and generate your report now?')) return;
    tts.cancel();
    speech.stop();
    setLoading(true);
    try {
      const { data } = await api.post('/practice/end', { sessionId });
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
        <h1>Practice Report</h1>
        <ReportView report={report} />
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="page">
        <h1>English Communication Practice</h1>
        <form className="upload-card" onSubmit={handleStart}>
          <p className="muted">
            Enter a topic you'd like to talk about (e.g. "My hometown", "Climate change", "My favourite hobby").
            This is a spoken conversation: press <strong>Start</strong> to begin speaking, and
            <strong> Stop</strong> when you're done — the AI will then process it and reply. Nothing is
            shown on screen while you talk; your speech is transcribed to text behind the scenes and
            saved, and you'll get a mistakes-and-corrections report when you end the session.
          </p>
          {!voiceReady && (
            <p className="muted small">
              Voice conversation isn't supported in this browser — try Chrome or Edge on desktop.
              You'll be able to type your responses instead.
            </p>
          )}
          <input placeholder="Topic" value={topic} onChange={e => setTopic(e.target.value)} />
          {error && <p className="error">{error}</p>}
          <GlowButton type="submit" disabled={loading}>{loading ? 'Starting...' : 'Start Practice'}</GlowButton>
        </form>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="chat-header">
        <h1>Practice: {topic}</h1>
        <GlowButton variant="ghost" onClick={handleEnd} disabled={loading}>End & Get Report</GlowButton>
      </div>

      <div className="voice-stage">
        <div className={`voice-orb ${tts.speaking ? 'voice-orb--speaking' : ''} ${speech.listening ? 'voice-orb--listening' : ''}`} />
        <p className="voice-caption">
          {loading && 'Thinking...'}
          {!loading && tts.speaking && 'AI is speaking...'}
          {!loading && !tts.speaking && speech.listening && 'Recording — press Stop when you\u2019re done'}
          {!loading && !tts.speaking && !speech.listening && voiceReady && 'Press Start when you\u2019re ready to respond'}
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
            placeholder="Type your response..."
            value={typedMessage}
            onChange={e => setTypedMessage(e.target.value)}
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