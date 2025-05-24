
import React, { useState, useCallback, useEffect } from 'react';

interface UseTextToSpeechReturn {
  speak: (text: string, lang?: string) => void;
  cancel: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  availableArabicVoice: SpeechSynthesisVoice | null;
}

const useTextToSpeech = (): UseTextToSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [availableArabicVoice, setAvailableArabicVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
      const synth = window.speechSynthesis;
      setSpeechSynthesis(synth);
      
      const getVoices = () => {
        const voices = synth.getVoices();
        const arabicVoice = voices.find(voice => voice.lang.startsWith('ar')) || 
                             voices.find(voice => voice.lang.startsWith('ar-') || voice.name.toLowerCase().includes('arabic')) || // Broader check
                             null;
        setAvailableArabicVoice(arabicVoice);
        if (!arabicVoice) {
          console.warn("No specific Arabic voice found. TTS might use a default or not work optimally for Arabic.");
        }
      };

      getVoices();
      // Voices list might not be immediately available or might change
      if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = getVoices;
      }
    } else {
      console.warn("SpeechSynthesis API not supported in this browser.");
    }
  }, []);

  const speak = useCallback((text: string, lang: string = 'ar-SA') => {
    if (!isSupported || !speechSynthesis || isSpeaking || !text.trim()) return;

    speechSynthesis.cancel(); // Cancel any ongoing speech first

    const utterance = new SpeechSynthesisUtterance(text);
    
    if (availableArabicVoice) {
      utterance.voice = availableArabicVoice;
      utterance.lang = availableArabicVoice.lang; // Use the specific language of the found voice
    } else {
      utterance.lang = lang; // Fallback to provided lang or default
    }
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error('SpeechSynthesisUtterance.onerror', event);
      setIsSpeaking(false);
    };

    speechSynthesis.speak(utterance);
  }, [isSupported, speechSynthesis, isSpeaking, availableArabicVoice]);

  const cancel = useCallback(() => {
    if (isSupported && speechSynthesis) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported, speechSynthesis]);

  return { speak, cancel, isSpeaking, isSupported, availableArabicVoice };
};

export default useTextToSpeech;
