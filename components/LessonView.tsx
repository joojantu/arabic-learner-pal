
import React from 'react';
import { LessonPlan, VocabularyItem, PhraseItem } from '../types';
import useTextToSpeech from '../hooks/useTextToSpeech';
import { SpeakerIcon } from './icons';

interface LessonViewProps {
  lessonPlan: LessonPlan;
  onStartQuiz: () => void;
}

const Flashcard: React.FC<{
  item: VocabularyItem | PhraseItem;
  onPlayAudio: (text: string) => void;
  isSpeaking: boolean;
  isSupported: boolean;
}> = ({ item, onPlayAudio, isSpeaking, isSupported }) => {
  const handlePlayAudio = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent card click if clicking button
    onPlayAudio(item.audioSrc);
  };

  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl hover:ring-2 hover:ring-primary/50 transform hover:-translate-y-1 flex flex-col justify-between min-h-[160px]">
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-2xl sm:text-3xl font-bold text-primary rtl break-words" lang="ar" dir="rtl">{item.arabic}</h3>
          {isSupported && (
            <button
              onClick={handlePlayAudio}
              disabled={isSpeaking}
              className="p-2 rounded-full text-primary hover:bg-blue-100 focus:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`Play audio for ${item.arabic}`}
            >
              <SpeakerIcon className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
          )}
        </div>
        <p className="text-lg sm:text-xl text-gray-700 break-words">{item.english}</p>
      </div>
      <p className="text-md sm:text-lg text-secondary-darker font-semibold mt-2 break-words">{item.transliteration}</p>
    </div>
  );
};


const LessonView: React.FC<LessonViewProps> = ({ lessonPlan, onStartQuiz }) => {
  const { speak, isSpeaking, isSupported, availableArabicVoice, cancel } = useTextToSpeech();

  // Cancel any ongoing speech when the component unmounts or lessonPlan changes
  React.useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel, lessonPlan]);


  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 animate-fadeIn">
      <h1 className="text-3xl md:text-4xl font-extrabold text-primary text-center mb-8 break-words">
        {lessonPlan.title}
      </h1>
      
      {!isSupported && (
        <p className="text-center text-sm text-red-700 bg-red-100 p-3 rounded-md mb-6 shadow">
          Text-to-speech is not supported in your browser. Audio features will be unavailable.
        </p>
      )}
      {isSupported && !availableArabicVoice && (
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
                isSpeaking={isSpeaking}
                isSupported={isSupported} 
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
                isSpeaking={isSpeaking}
                isSupported={isSupported}
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
      ` }} />
    </div>
  );
};

export default LessonView;
