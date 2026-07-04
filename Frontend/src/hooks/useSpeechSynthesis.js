// Wraps the browser's Web Speech API (SpeechSynthesis) for text-to-speech,
// used to have the AI "speak" its interview questions / coaching replies aloud.
import { useCallback, useState } from 'react';

export default function useSpeechSynthesis() {
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [speaking, setSpeaking] = useState(false);

  const speak = useCallback((text) => {
    if (!isSupported || !text) return;
    window.speechSynthesis.cancel(); // stop anything currently queued/speaking
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.lang = 'en-US';
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [isSupported]);

  const cancel = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [isSupported]);

  return { isSupported, speaking, speak, cancel };
}
