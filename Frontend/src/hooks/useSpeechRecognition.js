// Wraps the browser's Web Speech API (SpeechRecognition) for live speech-to-text.
// Supported well in Chrome/Edge desktop & Android; not supported in Firefox,
// and only partially in Safari. Always feature-detect with `isSupported`.
import { useEffect, useRef, useState, useCallback } from 'react';

export default function useSpeechRecognition() {
  const [isSupported] = useState(
    () => typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  );
  const [listening, setListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!isSupported) return;
    const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionImpl();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      let finalChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalChunk += transcript + ' ';
        else interim += transcript;
      }
      if (finalChunk) setFinalText(prev => `${prev} ${finalChunk}`.trim());
      setInterimText(interim);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    return () => {
      try { recognition.stop(); } catch (_) { /* noop */ }
    };
  }, [isSupported]);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    setFinalText('');
    setInterimText('');
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (_) {
      // Recognition may already be running — ignore.
    }
  }, []);

  const stop = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch (_) { /* noop */ }
    setListening(false);
  }, []);

  const reset = useCallback(() => {
    setFinalText('');
    setInterimText('');
  }, []);

  return { isSupported, listening, interimText, finalText, start, stop, reset };
}
