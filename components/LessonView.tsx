
import React, { useState, useEffect } from 'react';
import { LessonPlan, VocabularyItem, PhraseItem } from '../types';
import useTextToSpeech from '../hooks/useTextToSpeech';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { SpeakerIcon, MicrophoneIcon } from './icons';
import { calculateArabicSimilarity } from '../utils/textSimilarity';

interface LessonViewProps {
  lessonPlan: LessonPlan;
  onStartQuiz: () => void;
}

const Flashcard: React.FC<{
  item: VocabularyItem | PhraseItem;
  onPlayAudio: (text: string) => void;
  isTextSpeaking: boolean;
  isTextToSpeechSupported: boolean;
}> = ({ item, onPlayAudio, isTextSpeaking, isTextToSpeechSupported }) => {
  const {
    isListening: isSpeechRecListening,
    transcript: speechRecTranscript,
    interimTranscript: speechRecInterimTranscript,
    error: speechRecError,
    isSupported: isSpeechRecSupported,
    startListening: startSpeechRecListening,
    stopListening: stopSpeechRecListening,
    resetTranscript: resetSpeechRecTranscript,
  } = useSpeechRecognition();

  const [attemptScore, setAttemptScore] = useState<number | null>(null);
  const [finalUserAttempt, setFinalUserAttempt] = useState<string>('');

  const handlePlayAudio = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isSpeechRecListening) stopSpeechRecListening(); // Stop mic if TTS is played
    onPlayAudio(item.audioSrc);
  };

  const handleMicClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isTextSpeaking) { // If TTS is speaking, stop it before starting mic
        // This requires the TTS cancel function to be passed down or accessible
        // For now, we assume TTS would stop on its own or the user waits
    }
    if (isSpeechRecListening) {
      stopSpeechRecListening();
    } else {
      resetSpeechRecTranscript();
      setAttemptScore(null);
      setFinalUserAttempt('');
      startSpeechRecListening('ar-SA'); // Using 'ar-SA' as a common Arabic locale
    }
  };

  useEffect(() => {
    if (!isSpeechRecListening && speechRecTranscript) {
      // Only calculate score when listening stops and there's a final transcript
      setFinalUserAttempt(speechRecTranscript);
      const score = calculateArabicSimilarity(item.arabic, speechRecTranscript);
      setAttemptScore(score);
    }
  }, [isSpeechRecListening, speechRecTranscript, item.arabic]);
  
  // Reset speech recognition state if item changes
  useEffect(() => {
    resetSpeechRecTranscript();
    setAttemptScore(null);
    setFinalUserAttempt('');
    if(isSpeechRecListening) stopSpeechRecListening();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);


  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl hover:ring-2 hover:ring-primary/50 transform hover:-translate-y-1 flex flex-col justify-between min-h-[200px]">
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-2xl sm:text-3xl font-bold text-primary rtl break-words" lang="ar" dir="rtl">{item.arabic}</h3>
          <div className="flex space-x-1">
            {isTextToSpeechSupported && (
              <button
                onClick={handlePlayAudio}
                disabled={isTextSpeaking}
                className="p-2 rounded-full text-primary hover:bg-blue-100 focus:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Play audio for ${item.arabic}`}
              >
                <SpeakerIcon className="w-6 h-6 sm:w-7 sm:h-7" />
              </button>
            )}
            {isSpeechRecSupported && (
              <button
                onClick={handleMicClick}
                disabled={isTextSpeaking} // Disable mic if TTS is active
                className={`p-2 rounded-full hover:bg-blue-100 focus:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed ${isSpeechRecListening ? 'text-red-500 animate-pulseRing' : 'text-primary'}`}
                aria-label={isSpeechRecListening ? 'Stop listening' : `Speak ${item.arabic}`}
              >
                <MicrophoneIcon className="w-6 h-6 sm:w-7 sm:h-7" />
              </button>
            )}
          </div>
        </div>
        <p className="text-lg sm:text-xl text-gray-700 break-words">{item.english}</p>
      </div>
      <p className="text-md sm:text-lg text-secondary-darker font-semibold mt-2 break-words">{item.transliteration}</p>
      
      {isSpeechRecSupported && (
        <div className="mt-3 pt-3 border-t border-gray-200 text-sm">
          {isSpeechRecListening && (
            <p className="text-blue-600 italic">Listening... Say: "{item.arabic}"</p>
          )}
          {speechRecInterimTranscript && <p className="text-gray-500 rtl" lang="ar" dir="rtl"><em>Interim: {speechRecInterimTranscript}</em></p>}
          {finalUserAttempt && !isSpeechRecListening && (
            <p className="text-gray-700 rtl font-medium" lang="ar" dir="rtl">Your attempt: {finalUserAttempt}</p>
          )}
          {attemptScore !== null && !isSpeechRecListening && (
             <p className={`font-semibold ${attemptScore >= 75 ? 'text-green-600' : attemptScore >=50 ? 'text-yellow-600' : 'text-red-600'}`}>
                Score: {attemptScore}%
              </p>
          )}
          {speechRecError && <p className="text-danger text-xs mt-1">{speechRecError}</p>}
        </div>
      )}
       {!isSpeechRecSupported && (
        <p className="text-xs text-yellow-700 bg-yellow-50 p-1 rounded mt-2">Speech practice unavailable: microphone input not supported by your browser.</p>
      )}
    </div>
  );
};


const LessonView: React.FC<LessonViewProps> = ({ lessonPlan, onStartQuiz }) => {
  const { speak, isSpeaking: isTextSpeaking, isSupported: isTextToSpeechSupported, availableArabicVoice, cancel } = useTextToSpeech();

  useEffect(() => {
    return () => {
      cancel(); // Cancel TTS
    };
  }, [cancel, lessonPlan]);


  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 animate-fadeIn">
      <h1 className="text-3xl md:text-4xl font-extrabold text-primary text-center mb-8 break-words">
        {lessonPlan.title}
      </h1>
      
      {!isTextToSpeechSupported && (
        <p className="text-center text-sm text-red-700 bg-red-100 p-3 rounded-md mb-6 shadow">
          Text-to-speech is not supported in your browser. Audio features will be unavailable.
        </p>
      )}
      {isTextToSpeechSupported && !availableArabicVoice && (
         <p className="text-center text-sm text-yellow-700 bg-yellow-100 p-3 rounded-md mb-6 shadow">
          An Arabic voice for text-to-speech was not found in your browser. Speech might use a default voice or may not work correctly for Arabic.
        </p>
      )}

      <section className="mb-10" aria-labelledby="vocabulary-heading">
        <h2 id="vocabulary-heading" className="text-2xl md:text-3xl font-semibold text-gray-800 mb-6 border-b-2 border-primary pb-2">
          Vocabulary Words
        </h2>
        {lessonPlan.vocabulary.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {lessonPlan.vocabulary.map((item, index) => (
              <Flashcard 
                key={`vocab-${index}-${item.arabic}`} 
                item={item} 
                onPlayAudio={speak} 
                isTextSpeaking={isTextSpeaking}
                isTextToSpeechSupported={isTextToSpeechSupported}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No vocabulary items provided for this lesson.</p>
        )}
      </section>

      <section className="mb-10" aria-labelledby="phrases-heading">
        <h2 id="phrases-heading" className="text-2xl md:text-3xl font-semibold text-gray-800 mb-6 border-b-2 border-primary pb-2">
          Key Phrases
        </h2>
         {lessonPlan.phrases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {lessonPlan.phrases.map((item, index) => (
              <Flashcard 
                key={`phrase-${index}-${item.arabic}`} 
                item={item} 
                onPlayAudio={speak} 
                isTextSpeaking={isTextSpeaking}
                isTextToSpeechSupported={isTextToSpeechSupported}
              />
            ))}
          </div>
         ) : (
          <p className="text-gray-500 italic">No key phrases provided for this lesson.</p>
         )}
      </section>

      {lessonPlan.quiz && lessonPlan.quiz.length > 0 && (
        <div className="text-center mt-12 mb-6">
          <button
            onClick={onStartQuiz}
            className="bg-accent hover:bg-accent-darker text-white font-bold py-3.5 px-10 rounded-lg text-xl shadow-md hover:shadow-lg transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-70 active:transform active:scale-95"
          >
            Ready? Start Quiz!
          </button>
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-pulseRing {
          animation: pulseRing 1.5s infinite;
        }
        @keyframes pulseRing {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } /* theme danger */
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      ` }} />
    </div>
  );
};

export default LessonView;